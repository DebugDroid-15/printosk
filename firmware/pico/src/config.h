/**
 * Printosk Pico - Configuration Header
 */

#ifndef PICO_CONFIG_H
#define PICO_CONFIG_H

// ============================================================================
// HARDWARE CONFIGURATION
// ============================================================================

// UART to ESP32
#define UART_ID uart0
#define UART_BAUD_RATE 115200
#define UART_TX_PIN 0        // GPIO 0
#define UART_RX_PIN 1        // GPIO 1
#define UART_BUFFER_SIZE 512

// USB (for printer)
// Uses default USB on Pico (pins 1-2 for D+/D-)

// ============================================================================
// DEBUG & LOGGING
// ============================================================================
#define ENABLE_DEBUG_LOGS 1
#define ENABLE_UART_DEBUG 0  // Log over UART (interferes with commands)

// ============================================================================
// PROTOCOL CONSTANTS
// ============================================================================

// Frame delimiters
#define FRAME_START 0xAA
#define FRAME_END 0xBB

// Command types
#define CMD_TYPE_PING 0x01
#define CMD_TYPE_PRINT 0x10
#define CMD_TYPE_CANCEL 0x11

// Status codes
#define CMD_STATUS_READY 0x00
#define CMD_STATUS_STARTED 0x01
#define CMD_STATUS_PRINTING 0x02
#define CMD_STATUS_DONE 0x03
#define CMD_STATUS_ERROR 0x04

// ============================================================================
// PRINTER SETTINGS
// ============================================================================

// Default USB IDs for common printers
// These can be overridden per printer model
#define PRINTER_VID 0x04B8  // Epson (example)
#define PRINTER_PID 0x0005  // Specific model (example)

// Print timeout (ms)
#define PRINT_TIMEOUT_MS 300000  // 5 minutes

// Page conversion
#define MAX_PAGES_PER_JOB 1000
#define MOCK_PRINT_TIME_PER_PAGE 100  // ms per page in mock mode

// ============================================================================
// MEMORY ALLOCATION
// ============================================================================

// Fixed buffers (no malloc after init)
#define PRINT_BUFFER_SIZE 65536      // 64 KB for print spool
#define UART_COMMAND_BUFFER 512
#define PRINTER_RESPONSE_BUFFER 256

// ============================================================================
// FEATURE FLAGS
// ============================================================================

#define FEATURE_MOCK_PRINTER 0       // Simulate printer for testing
#define FEATURE_SPOOL_TO_STORAGE 0   // Save print jobs to flash
#define FEATURE_DETAILED_STATUS 1    // Send progress updates

#endif // PICO_CONFIG_H
