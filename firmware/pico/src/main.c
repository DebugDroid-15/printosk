/**
 * Printosk Raspberry Pi Pico - Main Entry Point
 *
 * Responsibilities:
 * - UART communication with ESP32
 * - Parse print commands
 * - USB printer communication
 * - Execute print jobs synchronously
 * - Report status back to ESP32
 *
 * Hardware:
 * - Raspberry Pi Pico (RP2040)
 * - USB Host capability
 * - UART0 for ESP32 communication (TX=GPIO0, RX=GPIO1, 115200 baud)
 * - USB Data+/- for printer connection
 *
 * Architecture:
 * - Minimal dependencies (Pico SDK)
 * - Synchronous, deterministic execution
 * - No dynamic allocation once initialized
 * - Simple state machine for print lifecycle
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "pico/stdlib.h"
#include "pico/cyw43_arch.h"
#include "hardware/uart.h"
#include "hardware/gpio.h"

#include "config.h"
#include "uart.h"
#include "command_parser.h"
#include "printer.h"
#include "utils.h"

// Global state
static PrinterController printer;
static CommandParser parser;
static bool initialized = false;

/**
 * Initialize Pico hardware
 */
static void init_hardware() {
  log_info("Initializing Pico hardware...\n");

  // Initialize UART for ESP32 communication
  uart_init(UART_ID, UART_BAUD_RATE);
  gpio_set_function(UART_TX_PIN, GPIO_FUNC_UART);
  gpio_set_function(UART_RX_PIN, GPIO_FUNC_UART);

  // Set UART parameters: 8N1
  uart_set_hw_flow(UART_ID, false, false);
  uart_set_format(UART_ID, 8, 1, UART_PARITY_NONE);

  log_info("UART initialized: %u baud\n", UART_BAUD_RATE);

  // Initialize printer hardware
  if (!printer_init(&printer)) {
    log_error("Failed to initialize printer!\n");
  } else {
    log_info("Printer initialized\n");
  }

  initialized = true;
  log_info("Pico initialization complete\n\n");
}

/**
 * Send status response back to ESP32
 */
static void send_status_response(
  const char* job_id,
  uint8_t status_code,
  int progress,
  const char* message
) {
  CommandResponse response;
  response.status = status_code;
  response.progress = progress;
  strncpy(response.job_id, job_id, sizeof(response.job_id) - 1);
  response.job_id[sizeof(response.job_id) - 1] = '\0';
  strncpy(response.message, message ? message : "", sizeof(response.message) - 1);
  response.message[sizeof(response.message) - 1] = '\0';

  uart_send_response(UART_ID, &response);
}

/**
 * Main print job execution loop
 * Runs synchronously until job complete or error
 */
static void execute_print_job(const PrintCommand* cmd) {
  log_info("========================================\n");
  log_info("Starting print job: %s\n", cmd->job_id);
  log_info("Pages: %d, Color: %s, Copies: %d\n",
    cmd->total_pages,
    cmd->color ? "Yes" : "No",
    cmd->copies);
  log_info("========================================\n\n");

  // Send STARTED status
  send_status_response(cmd->job_id, CMD_STATUS_STARTED, 0, "Print job started");
  sleep_ms(500);

  // ========================================================================
  // STEP 1: Download file from URL (simulated or real)
  // ========================================================================
  log_info("[STEP 1/3] Downloading file from Supabase...\n");
  if (!cmd->mock_mode) {
    // In production: would use TLS client to download file
    // For now: mock mode assumed
    log_warn("File download not implemented (mock mode assumed)\n");
  }

  send_status_response(cmd->job_id, CMD_STATUS_PRINTING, 20, "File downloaded");
  sleep_ms(500);

  // ========================================================================
  // STEP 2: Connect to printer via USB
  // ========================================================================
  log_info("[STEP 2/3] Connecting to printer...\n");

  if (!printer_connect(&printer)) {
    log_error("Failed to connect to printer!\n");
    send_status_response(cmd->job_id, CMD_STATUS_ERROR, 0, "Printer connection failed");
    return;
  }

  log_info("Printer connected\n");
  send_status_response(cmd->job_id, CMD_STATUS_PRINTING, 40, "Connected to printer");
  sleep_ms(500);

  // ========================================================================
  // STEP 3: Send print command and wait for completion
  // ========================================================================
  log_info("[STEP 3/3] Sending print command...\n");

  PrintJob job;
  job.total_pages = cmd->total_pages;
  job.color = cmd->color;
  job.copies = cmd->copies;
  strncpy(job.job_id, cmd->job_id, sizeof(job.job_id) - 1);

  if (!printer_print(&printer, &job)) {
    log_error("Print job failed!\n");
    send_status_response(cmd->job_id, CMD_STATUS_ERROR, 0, "Print job failed");
    printer_disconnect(&printer);
    return;
  }

  log_info("Print completed successfully\n");
  send_status_response(cmd->job_id, CMD_STATUS_DONE, 100, "Print completed successfully");

  // Disconnect printer
  printer_disconnect(&printer);

  log_info("\n========================================\n");
  log_info("Job complete\n");
  log_info("========================================\n\n");
}

/**
 * UART receive loop
 * Continuously monitors for commands from ESP32
 */
static void uart_receive_loop() {
  static uint8_t buffer[UART_BUFFER_SIZE];
  int bytes_read = 0;

  // Wait for incoming data
  if (uart_is_readable(UART_ID)) {
    bytes_read = uart_read_blocking(UART_ID, buffer, UART_BUFFER_SIZE);

    if (bytes_read > 0) {
      log_debug("Received %d bytes\n", bytes_read);

      // Parse command
      ParseResult result = parse_command(buffer, bytes_read);

      if (result.success) {
        log_info("Command parsed: type=%d, job_id=%s\n",
          result.command.type,
          result.command.job_id);

        // Execute print job
        execute_print_job(&result.command);
      } else {
        log_error("Failed to parse command: error=%d\n", result.error);
        send_status_response("UNKNOWN", CMD_STATUS_ERROR, 0, "Parse error");
      }
    }
  }
}

/**
 * Main function
 */
int main() {
  // Initialize standard I/O
  stdio_init_all();

  // Small delay to let serial monitor catch startup
  sleep_ms(2000);

  log_info("\n\n");
  log_info("========================================\n");
  log_info("Printosk Raspberry Pi Pico Firmware v1.0\n");
  log_info("========================================\n\n");

  // Initialize hardware
  init_hardware();

  // Send startup message to ESP32
  CommandResponse startup_response;
  startup_response.status = CMD_STATUS_READY;
  startup_response.progress = 0;
  strcpy(startup_response.job_id, "PICO");
  strcpy(startup_response.message, "Pico ready");
  uart_send_response(UART_ID, &startup_response);

  // Main loop
  log_info("Waiting for print commands...\n\n");

  while (true) {
    uart_receive_loop();

    // Yield to prevent watchdog timeout
    sleep_ms(100);
  }

  return 0;
}
