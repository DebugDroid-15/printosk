/**
 * Printosk - Raspberry Pi Pico Printer Controller
 * 
 * Features:
 * - USB serial communication with ESP32
 * - EPSON L3115 printer control via ESC/POS commands
 * - Print job status tracking
 * - Error handling and reporting
 */

#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/uart.h"
#include "hardware/gpio.h"

// UART Configuration
#define UART_ID uart1
#define BAUD_RATE 115200
#define UART_TX_PIN 8
#define UART_RX_PIN 9

// Buffer sizes
#define RX_BUFFER_SIZE 256
#define TX_BUFFER_SIZE 256

// Global variables
char rx_buffer[RX_BUFFER_SIZE];
int rx_index = 0;
bool command_ready = false;
bool printer_busy = false;

// Printer status flags
bool printer_online = false;
uint8_t printer_error = 0;

// Function declarations
void uart_init_custom();
void send_to_esp(const char* message);
void handle_command(const char* command);
void print_file(const char* printId, int fileIndex);
void send_status(const char* status, const char* message);
void printer_init();
void printer_print_data(uint8_t* data, int length);
void printer_feed_paper(int lines);
void printer_cut();

int main() {
  // Initialize stdio for debug output
  stdio_init_all();
  
  printf("\n\n[SYSTEM] Printosk Pico Firmware Starting...\n");
  
  // Initialize UART
  uart_init_custom();
  
  // Initialize printer
  printer_init();
  
  // Send ready signal
  send_to_esp("READY");
  printf("[SYSTEM] Ready!\n");
  
  // Main loop
  while (true) {
    // Check UART for incoming data
    while (uart_is_readable(UART_ID)) {
      char c = uart_getc(UART_ID);
      
      if (c == '\n') {
        rx_buffer[rx_index] = '\0';
        command_ready = true;
        printf("[UART] Received: %s\n", rx_buffer);
      } else if (c != '\r') {
        if (rx_index < RX_BUFFER_SIZE - 1) {
          rx_buffer[rx_index++] = c;
        }
      }
    }
    
    // Process command if ready
    if (command_ready) {
      command_ready = false;
      handle_command(rx_buffer);
      rx_index = 0;
    }
    
    sleep_ms(10);
  }
  
  return 0;
}

void uart_init_custom() {
  // Set up UART with the correct pins and baudrate
  uart_init(UART_ID, BAUD_RATE);
  
  // Set the TX and RX pins by using the functional defaults
  gpio_set_function(UART_TX_PIN, GPIO_FUNC_UART);
  gpio_set_function(UART_RX_PIN, GPIO_FUNC_UART);
  
  printf("[UART] Initialized at %d baud\n", BAUD_RATE);
}

void send_to_esp(const char* message) {
  uart_puts(UART_ID, message);
  uart_putc(UART_ID, '\n');
  printf("[UART] Sent: %s\n", message);
}

void handle_command(const char* command) {
  printf("[CMD] Processing: %s\n", command);
  
  if (strncmp(command, "ESP_READY", 9) == 0) {
    // ESP32 is ready
    send_to_esp("PICO_READY");
    printf("[CMD] ESP32 handshake complete\n");
  }
  else if (strncmp(command, "START_PRINT", 11) == 0) {
    // Parse print command: START_PRINT:printId:fileCount
    char printId[20] = {0};
    int fileCount = 0;
    
    sscanf(command, "START_PRINT:%[^:]:%d", printId, &fileCount);
    printf("[CMD] Starting print job - ID: %s, Files: %d\n", printId, fileCount);
    
    send_to_esp("PRINTING");
    
    // Start printing files (index 0 for now)
    print_file(printId, 0);
  }
  else if (strncmp(command, "CANCEL", 6) == 0) {
    printf("[CMD] Canceling print job\n");
    send_to_esp("CANCELLED");
  }
  else if (strncmp(command, "STATUS", 6) == 0) {
    printf("[CMD] Status request\n");
    char status[32];
    if (printer_online) {
      snprintf(status, sizeof(status), "ONLINE_ERROR_%d", printer_error);
    } else {
      snprintf(status, sizeof(status), "ONLINE");
    }
    send_to_esp(status);
  }
  else {
    printf("[CMD] Unknown command: %s\n", command);
    send_to_esp("ERROR_UNKNOWN_CMD");
  }
}

void print_file(const char* printId, int fileIndex) {
  printf("[PRINT] Printing file %d from job %s\n", fileIndex, printId);
  
  // In actual implementation:
  // 1. Request file from ESP32
  // 2. Receive file data
  // 3. Convert to printable format (PDFs need to be converted to images/text)
  // 4. Send ESC/POS commands to printer
  // 5. Monitor printer status
  
  if (printer_online && printer_error == 0) {
    // Simulate printing
    printf("[PRINT] Sending to printer...\n");
    
    // Send print start command
    printer_feed_paper(5);
    
    // Example: Print test text
    uint8_t test_data[] = "Test Print\nFrom Pico\n";
    printer_print_data(test_data, strlen((char*)test_data));
    
    // Feed paper and cut
    printer_feed_paper(5);
    printer_cut();
    
    send_to_esp("COMPLETE");
    printf("[PRINT] Print job complete!\n");
  } else {
    send_to_esp("ERROR_PRINTER_OFFLINE");
    printf("[PRINT] Printer error: offline=%d, error=%d\n", !printer_online, printer_error);
  }
}

void send_status(const char* status, const char* message) {
  char buffer[128];
  snprintf(buffer, sizeof(buffer), "%s:%s", status, message);
  send_to_esp(buffer);
}

void printer_init() {
  printf("[PRINTER] Initializing EPSON L3115...\n");
  
  // In actual implementation, this would:
  // 1. Initialize USB/Serial connection to printer
  // 2. Send initialization ESC/POS commands
  // 3. Check printer status
  
  printer_online = true;
  printer_error = 0;
  
  // ESC @ - Initialize printer
  // ESC ! - Select print mode
  
  printf("[PRINTER] Initialized\n");
}

void printer_print_data(uint8_t* data, int length) {
  if (!printer_online) {
    printf("[PRINTER] Error: Printer offline\n");
    return;
  }
  
  printf("[PRINTER] Printing %d bytes\n", length);
  
  // In actual implementation, would send to printer via USB
  // For now, just simulate
  
  sleep_ms(100);  // Simulate print time
}

void printer_feed_paper(int lines) {
  if (!printer_online) return;
  
  printf("[PRINTER] Feeding %d lines\n", lines);
  
  // ESC d - Feed paper n lines
  // Command format: ESC 'd' n
}

void printer_cut() {
  if (!printer_online) return;
  
  printf("[PRINTER] Cutting paper\n");
  
  // GS V - Cut paper command
  // Command format: GS 'V' mode
}
