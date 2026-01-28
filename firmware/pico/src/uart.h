/**
 * Printosk Pico - UART Communication Layer
 * Handles frame-based protocol with ESP32
 */

#ifndef PICO_UART_H
#define PICO_UART_H

#include <stdint.h>
#include <stdbool.h>

// Command structure (received from ESP32)
typedef struct {
  uint8_t type;           // CMD_TYPE_PRINT, CMD_TYPE_CANCEL
  char job_id[37];        // UUID
  int total_pages;
  bool color;
  int copies;
  char file_url[512];     // Supabase signed URL
  bool mock_mode;         // For testing
} PrintCommand;

// Response structure (sent to ESP32)
typedef struct {
  char job_id[37];
  uint8_t status;         // CMD_STATUS_DONE, ERROR, etc.
  int progress;           // 0-100
  char message[256];      // Status message
} CommandResponse;

// Parse result
typedef struct {
  bool success;
  int error;              // Error code if !success
  PrintCommand command;
} ParseResult;

/**
 * Initialize UART
 */
void uart_init_simple(uint uart_id, uint baud_rate);

/**
 * Check if data available on UART
 */
bool uart_has_data(uint uart_id);

/**
 * Read bytes from UART with timeout
 */
int uart_read_timeout(uint uart_id, uint8_t* buf, int len, uint timeout_ms);

/**
 * Send response frame back to ESP32
 */
bool uart_send_response(uint uart_id, const CommandResponse* response);

/**
 * Send debug message (stdout)
 */
void uart_send_debug(const char* format, ...);

#endif // PICO_UART_H
