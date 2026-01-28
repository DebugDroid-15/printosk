/**
 * Printosk ESP32 - Configuration Header
 * Centralized configuration for hardware pins, WiFi, API endpoints
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// SERIAL & DEBUG
// ============================================================================
#define SERIAL_BAUD_RATE 115200
#define LOG_LEVEL_DEBUG   1  // Set to 0 to disable debug logs
#define MEMORY_STATS 1       // Log heap stats periodically

// ============================================================================
// HARDWARE PINS
// ============================================================================

// Keypad pins (4x4 matrix)
#define KEYPAD_ROW_PINS { 14, 27, 26, 25 }   // Rows (GPIO 14, 27, 26, 25)
#define KEYPAD_COL_PINS { 18, 19, 21, 22 }   // Cols (GPIO 18, 19, 21, 22)
#define KEYPAD_ROWS 4
#define KEYPAD_COLS 4

// OLED display (SSD1306 via I2C)
#define OLED_I2C_SDA 21
#define OLED_I2C_SCL 22
#define OLED_I2C_FREQ 400000  // 400 kHz
#define OLED_ADDRESS 0x3C     // Default I2C address
#define OLED_WIDTH 128
#define OLED_HEIGHT 64

// UART to Pico
#define UART_NUM UART_NUM_2
#define UART_TX_PIN 17
#define UART_RX_PIN 16
#define UART_BAUD_RATE 115200
#define UART_BUFFER_SIZE 512

// ============================================================================
// KEYPAD LAYOUT
// ============================================================================
// Standard numeric keypad:
// 1 2 3 (Enter)
// 4 5 6 (Backspace)
// 7 8 9 (Up)
// * 0 # (Down)

#define KEYPAD_KEYS \
  "123E" \
  "456B" \
  "789U" \
  "*0#D"

#define KEY_ENTER 'E'
#define KEY_BACKSPACE 'B'
#define KEY_UP 'U'
#define KEY_DOWN 'D'
#define KEY_NONE '\0'

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================
#define SUPABASE_URL "https://YOUR_PROJECT.supabase.co"
#define SUPABASE_API_KEY "YOUR_ANON_KEY"
#define SUPABASE_SERVICE_ROLE_KEY "YOUR_SERVICE_ROLE_KEY"

// ============================================================================
// WIFI CONFIGURATION
// ============================================================================
#define WIFI_SSID "YOUR_SSID"
#define WIFI_PASSWORD "YOUR_PASSWORD"
#define WIFI_CONNECT_TIMEOUT_MS 10000
#define WIFI_MAX_RETRIES 5

// ============================================================================
// DEVICE IDENTIFICATION
// ============================================================================
#define DEVICE_NAME "KIOSK_01"
#define FIRMWARE_VERSION "1.0.0"
#define FIRMWARE_BUILD_DATE __DATE__

// ============================================================================
// PRINT ID INPUT SETTINGS
// ============================================================================
#define PRINT_ID_LENGTH 6
#define PRINT_ID_INPUT_TIMEOUT_MS 30000  // 30 seconds to enter ID
#define PRINT_ID_RETRY_MAX 3             // Max retries for invalid IDs

// ============================================================================
// STATE MACHINE TIMEOUTS
// ============================================================================
#define STATE_FETCHING_TIMEOUT_MS 10000    // Max wait for job fetch
#define STATE_PRINTING_TIMEOUT_MS 300000   // Max wait for print completion (5 min)
#define STATE_ERROR_TIMEOUT_MS 30000       // Error state duration before reset

// ============================================================================
// DISPLAY SETTINGS
// ============================================================================
#define DISPLAY_REFRESH_MS 500
#define DISPLAY_TEXT_SIZE 1
#define DISPLAY_TEXT_COLOR SSD1306_WHITE
#define DISPLAY_BG_COLOR SSD1306_BLACK

// ============================================================================
// UART PROTOCOL SETTINGS
// ============================================================================
#define UART_FRAME_START 0xAA
#define UART_FRAME_END 0xBB
#define UART_FRAME_TIMEOUT_MS 5000
#define UART_ACK_TIMEOUT_MS 1000

// Message types for UART protocol
#define UART_MSG_PING 0x01
#define UART_MSG_PRINT_CMD 0x10
#define UART_MSG_STATUS 0x20
#define UART_MSG_ERROR 0x30
#define UART_MSG_ACK 0xFF

// ============================================================================
// API ENDPOINTS
// ============================================================================
#define API_ENDPOINT_FETCH_JOB "/rest/v1/print_jobs"
#define API_ENDPOINT_UPDATE_STATUS "/rest/v1/rpc/update_job_status"
#define API_ENDPOINT_DELETE_JOB "/rest/v1/rpc/mark_job_for_deletion"

// ============================================================================
// MEMORY & PERFORMANCE SETTINGS
// ============================================================================
#define STACK_SIZE_KEYPAD 2048
#define STACK_SIZE_DISPLAY 2048
#define STACK_SIZE_NETWORK 3072
#define STACK_SIZE_UART 2048

#define PRIORITY_KEYPAD 1    // Low priority
#define PRIORITY_DISPLAY 1   // Low priority
#define PRIORITY_NETWORK 1   // Low priority
#define PRIORITY_UART 2      // Higher priority for real-time data

// ============================================================================
// FEATURE FLAGS
// ============================================================================
#define FEATURE_MOCK_KEYPAD 0       // Simulate keypad input for testing
#define FEATURE_MOCK_SUPABASE 0     // Simulate Supabase responses
#define FEATURE_DEBUG_DISPLAY 0     // Show debug info on OLED

#endif // CONFIG_H
