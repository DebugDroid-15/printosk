#ifndef PRINTOSK_CONFIG_H
#define PRINTOSK_CONFIG_H

// WiFi Configuration
#define WIFI_SSID "Manakusakuuuu"
#define WIFI_PASSWORD "123456789"

// API Configuration
#define API_BASE_URL "https://printosk.vercel.app/api/kiosk"
#define API_TIMEOUT 30000  // 30 seconds

// Hardware Pins - ESP32 DevKit V1
// OLED I2C (SSD1306)
#define OLED_SDA_PIN 21
#define OLED_SCL_PIN 22
#define OLED_I2C_ADDRESS 0x3C

// Keypad Pins (GPIO for numeric buttons 0-9)
#define BUTTON_0_PIN 13
#define BUTTON_1_PIN 12
#define BUTTON_2_PIN 14
#define BUTTON_3_PIN 27
#define BUTTON_4_PIN 26
#define BUTTON_5_PIN 25
#define BUTTON_6_PIN 33
#define BUTTON_7_PIN 32
#define BUTTON_8_PIN 4
#define BUTTON_9_PIN 5
#define BUTTON_ENTER_PIN 15

// Serial Communication with Pico
// Software UART using Pico GPIO 2 (bit-banging)
#define PICO_SERIAL Serial2
#define PICO_TX_PIN 17  // Not used in software UART
#define PICO_RX_PIN 16  // Receives from Pico GPIO 2
#define PICO_BAUD_RATE 115200

// Application Settings
#define MAX_PRINT_ID_LENGTH 6
#define DISPLAY_TIMEOUT 30000  // Auto-clear screen after 30 seconds
#define MAX_RETRIES 3

// Display States
enum DisplayState {
  STATE_WELCOME,
  STATE_INPUT_ID,
  STATE_FETCHING,
  STATE_PRINTING,
  STATE_SUCCESS,
  STATE_ERROR,
  STATE_IDLE
};

#endif
