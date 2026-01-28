/**
 * Printosk ESP32 Firmware - Main Entry Point
 *
 * Responsibilities:
 * - WiFi management and connectivity
 * - Keypad input handling
 * - OLED display management
 * - Supabase REST API client
 * - UART communication with Pico
 * - Finite state machine for job lifecycle
 *
 * Hardware:
 * - ESP32 DevKit v1
 * - 4x4 Numeric Keypad (GPIO 14-17: rows, GPIO 18-21: cols)
 * - SSD1306 OLED 128x64 (I2C: SDA=GPIO21, SCL=GPIO22)
 * - UART to Pico (TX=GPIO17, RX=GPIO16, 115200 baud)
 */

#include "config.h"
#include "wifi_manager.h"
#include "supabase_client.h"
#include "keypad.h"
#include "display.h"
#include "uart_protocol.h"
#include "state_machine.h"
#include "utils.h"
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

// Global state
StateMachine stateMachine;
UARTProtocol uartProtocol;
KeypadManager keypadManager;
DisplayManager displayManager;
SupabaseClient supabaseClient;

// Task handles
TaskHandle_t keypadTaskHandle = NULL;
TaskHandle_t displayTaskHandle = NULL;
TaskHandle_t networkTaskHandle = NULL;
TaskHandle_t uartTaskHandle = NULL;

/**
 * Keypad input handling task
 * Runs continuously to detect button presses
 */
void keypadTask(void *pvParameters) {
  while (true) {
    char key = keypadManager.readKey();
    if (key != KEY_NONE) {
      log_info("[KEYPAD] Pressed: %c", key);
      
      // Dispatch key to state machine
      stateMachine.handleKeyInput(key);
    }
    
    vTaskDelay(pdMS_TO_TICKS(50)); // 50ms debounce
  }
}

/**
 * Display update task
 * Periodically refreshes OLED based on current state
 */
void displayTask(void *pvParameters) {
  uint32_t lastUpdate = 0;
  
  while (true) {
    // Update display every 500ms or on state change
    if (millis() - lastUpdate > 500 || stateMachine.hasStateChanged()) {
      displayManager.updateDisplay(&stateMachine);
      lastUpdate = millis();
    }
    
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

/**
 * Network connectivity task
 * Monitors WiFi and handles reconnection
 */
void networkTask(void *pvParameters) {
  while (true) {
    if (!WiFiManager.isConnected()) {
      log_warn("[NETWORK] WiFi disconnected, reconnecting...");
      displayManager.showMessage("Reconnecting...");
      
      if (WiFiManager.connect(WIFI_SSID, WIFI_PASSWORD)) {
        log_info("[NETWORK] WiFi reconnected");
        displayManager.showMessage("Connected!");
      } else {
        log_error("[NETWORK] Failed to reconnect");
        displayManager.showMessage("Connection failed!");
      }
    }
    
    vTaskDelay(pdMS_TO_TICKS(5000)); // Check every 5s
  }
}

/**
 * UART communication task
 * Handles responses from Pico printer controller
 */
void uartTask(void *pvParameters) {
  static uint8_t buffer[UART_BUFFER_SIZE];
  int len;
  
  while (true) {
    // Check for incoming data from Pico
    len = uartProtocol.readFrame(buffer, UART_BUFFER_SIZE);
    if (len > 0) {
      log_info("[UART] Received %d bytes from Pico", len);
      
      // Parse and handle response
      UARTMessage response;
      if (uartProtocol.parseMessage(buffer, len, &response)) {
        log_info("[UART] Parsed message type: %d", response.type);
        stateMachine.handleUARTResponse(&response);
      } else {
        log_error("[UART] Failed to parse message");
      }
    }
    
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

/**
 * ESP32 initialization
 * Called once on startup
 */
void setup() {
  // Serial for debugging
  Serial.begin(115200);
  delay(1000);
  
  log_info("\n\n========================================");
  log_info("Printosk ESP32 Firmware v1.0");
  log_info("Device ID: %s", get_device_id().c_str());
  log_info("========================================\n");
  
  // Initialize hardware
  log_info("[INIT] Initializing display...");
  if (!displayManager.init()) {
    log_error("[INIT] Failed to initialize display!");
  }
  displayManager.showMessage("Initializing...");
  
  log_info("[INIT] Initializing keypad...");
  if (!keypadManager.init()) {
    log_error("[INIT] Failed to initialize keypad!");
  }
  
  log_info("[INIT] Initializing UART...");
  if (!uartProtocol.init(UART_TX_PIN, UART_RX_PIN, UART_BAUD_RATE)) {
    log_error("[INIT] Failed to initialize UART!");
  }
  
  // Connect to WiFi
  log_info("[INIT] Connecting to WiFi...");
  displayManager.showMessage("Connecting WiFi...");
  if (WiFiManager.init(WIFI_SSID, WIFI_PASSWORD)) {
    log_info("[INIT] WiFi connected!");
    displayManager.showMessage("WiFi OK");
  } else {
    log_warn("[INIT] WiFi connection failed, retrying...");
  }
  
  // Initialize Supabase client
  log_info("[INIT] Initializing Supabase client...");
  if (!supabaseClient.init(SUPABASE_URL, SUPABASE_API_KEY)) {
    log_error("[INIT] Failed to initialize Supabase client!");
  }
  
  // Initialize state machine
  log_info("[INIT] Initializing state machine...");
  stateMachine.init(&supabaseClient, &uartProtocol, &displayManager);
  
  // Create FreeRTOS tasks
  log_info("[INIT] Creating tasks...");
  xTaskCreatePinnedToCore(keypadTask, "keypad", 2048, NULL, 1, &keypadTaskHandle, 1);
  xTaskCreatePinnedToCore(displayTask, "display", 2048, NULL, 1, &displayTaskHandle, 1);
  xTaskCreatePinnedToCore(networkTask, "network", 3072, NULL, 1, &networkTaskHandle, 0);
  xTaskCreatePinnedToCore(uartTask, "uart", 2048, NULL, 2, &uartTaskHandle, 0);
  
  log_info("[INIT] Setup complete!");
  delay(2000);
  displayManager.showMessage("Ready");
}

/**
 * Main loop
 * Handled by FreeRTOS tasks, this is a placeholder
 */
void loop() {
  // All work is done in FreeRTOS tasks
  vTaskDelay(pdMS_TO_TICKS(10000));
  
  // Periodic debug info
  log_debug("[HEAP] Free heap: %u bytes, largest block: %u bytes",
    ESP.getFreeHeap(),
    ESP.getMaxAllocHeap());
}
