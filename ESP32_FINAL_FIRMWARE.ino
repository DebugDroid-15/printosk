/**
 * Printosk - ESP32 Kiosk Firmware
 * 
 * FINAL VERSION - Complete Active Communication Implementation
 * 
 * Features:
 * - WiFi connectivity with SSID/Password
 * - Numeric keypad input (0-9 + Enter)
 * - SH1106 OLED display (128x64)
 * - REST API communication with backend server
 * - Active UART communication with Pico microcontroller
 * - Print job status tracking and updates
 * - Real-time message buffering and processing
 * - Echo test mode (press 0-0-0 for diagnostics)
 * 
 * Pin Configuration:
 * - I2C: GPIO 21 (SDA), GPIO 22 (SCL) - OLED Display
 * - UART: GPIO 1 (TX), GPIO 3 (RX) - Pico Communication
 * - Keypad: GPIO 13, 12, 14, 27, 26, 25, 33, 32, 4, 5, 15
 * 
 * Baud Rates:
 * - Serial Monitor: 115200
 * - Pico UART: 115200
 * 
 * Latest Commit: dbae7b3 (Pico syntax fix)
 * Updated: February 1, 2026
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include "config.h"

// ============= DISPLAY SETUP =============
Adafruit_SH1106G display(128, 64, &Wire, -1);

// ============= GLOBAL STATE VARIABLES =============
String currentPrintId = "";
DisplayState currentState = STATE_WELCOME;
unsigned long lastInteractionTime = 0;
bool wifiConnected = false;
bool picoConnected = false;

// ============= PICO COMMUNICATION BUFFER =============
// Active listening buffer to capture all Pico messages
#define PICO_RX_BUFFER_SIZE 512
char picoRxBuffer[PICO_RX_BUFFER_SIZE];
int picoRxIndex = 0;
unsigned long lastPicoMessageTime = 0;
unsigned long lastHeartbeatTime = 0;  // Track heartbeat timing
int espHeartbeatCounter = 0;  // Heartbeat counter

// ============= BUTTON CONFIGURATION =============
const int buttonPins[11] = {
  BUTTON_0_PIN, BUTTON_1_PIN, BUTTON_2_PIN, BUTTON_3_PIN, BUTTON_4_PIN,
  BUTTON_5_PIN, BUTTON_6_PIN, BUTTON_7_PIN, BUTTON_8_PIN, BUTTON_9_PIN,
  BUTTON_ENTER_PIN
};

const char* buttonLabels[11] = {
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "ENTER"
};

// ============= TEST MODE VARIABLES =============
unsigned long lastButtonTime = 0;
String debugSequence = "";

// ============= FORWARD DECLARATIONS =============
void initializeDisplay();
void initializeButtons();
void initializeSerial();
void initializeWiFi();
void handleKeypadInput();
void handleButtonPress(int buttonIndex);
void processPicoMessages();
void displayWelcomeScreen();
void displayInputScreen();
void displayFetchingScreen();
void displayPrintingScreen();
void displaySuccessScreen();
void displayErrorScreen(String message);
void displayIdleScreen();
void fetchPrintJob(String printId);
void sendToPico(String command);
void testPicoCommunication();
void updatePrintJobStatus(String printId, String status, String errorMsg = "");

/**
 * ============= SETUP FUNCTION =============
 * Initializes all hardware components and connects to services
 */
void setup() {
  // Initialize serial communication with computer
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("[SYSTEM] Printosk ESP32 Kiosk Starting...");
  Serial.println("========================================");
  Serial.println("[SYSTEM] Version: Final (Feb 1, 2026)");
  Serial.println("[SYSTEM] Commit: dbae7b3");
  
  // Initialize all components in order
  initializeDisplay();
  initializeButtons();
  initializeSerial();
  initializeWiFi();
  
  // Show welcome screen on display
  display.clearDisplay();
  displayWelcomeScreen();
  
  Serial.println("[SYSTEM] Setup Complete!");
  Serial.println("========================================\n");
}

/**
 * ============= MAIN LOOP =============
 * Continuously monitors WiFi, Pico communication, keypad, and timeouts
 */
void loop() {
  // ===== CHECK WIFI CONNECTION =====
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiConnected) {
      wifiConnected = true;
      Serial.println("[WiFi] Connected!");
    }
  } else {
    if (wifiConnected) {
      wifiConnected = false;
      Serial.println("[WiFi] Disconnected!");
      displayErrorScreen("WiFi Disconnected");
    }
  }
  
  // ===== ACTIVE LISTENING FOR PICO =====
  // Process ALL available messages from Pico UART
  // This ensures no messages are missed due to timing
  processPicoMessages();
  
  // ===== SEND HEARTBEAT TO PICO =====
  // Send heartbeat every 5 seconds (5000ms)
  unsigned long currentTime = millis();
  if (currentTime - lastHeartbeatTime >= 5000) {
    lastHeartbeatTime = currentTime;
    espHeartbeatCounter++;
    
    // Send heartbeat message
    String heartbeat = "ESP32_HEARTBEAT:" + String(espHeartbeatCounter);
    PICO_SERIAL.println(heartbeat);
    PICO_SERIAL.flush();
    
    Serial.println("[Heartbeat] Sent: " + heartbeat);
  }
  
  // ===== HANDLE USER INPUT =====
  handleKeypadInput();
  
  // ===== AUTO-CLEAR SCREEN ON TIMEOUT =====
  if (currentState != STATE_WELCOME && currentState != STATE_IDLE) {
    if (millis() - lastInteractionTime > DISPLAY_TIMEOUT) {
      currentState = STATE_WELCOME;
      display.clearDisplay();
      displayWelcomeScreen();
    }
  }
  
  delay(10);  // Small delay to prevent CPU hogging
}

/**
 * ============= INITIALIZATION FUNCTIONS =============
 */

void initializeDisplay() {
  Serial.println("[Display] Initializing SH1106 OLED...");
  
  // Initialize I2C on GPIO 21 (SDA) and GPIO 22 (SCL)
  Wire.begin(21, 22);
  
  // Initialize display (address 0x3C, reset enabled)
  if (!display.begin(0x3C, true)) {
    Serial.println("[Display] ERROR: SH1106 allocation failed!");
    return;
  }
  
  // Clear and setup initial display
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("Printosk Initializing...");
  display.display();
  
  delay(500);
  
  Serial.println("[Display] SH1106 Initialized successfully");
}

void initializeButtons() {
  Serial.println("[Buttons] Initializing 11-button keypad...");
  
  for (int i = 0; i < 11; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
  }
  
  Serial.println("[Buttons] All 11 buttons initialized (0-9 + ENTER)");
}

void initializeSerial() {
  Serial.println("[Serial] Initializing Pico UART communication...");
  
  // Serial2 uses GPIO 16 (RX) and GPIO 17 (TX)
  // These connect to Pico UART1: GPIO 9 (RX) and GPIO 8 (TX)
  PICO_SERIAL.begin(PICO_BAUD_RATE, SERIAL_8N1, PICO_RX_PIN, PICO_TX_PIN);
  
  Serial.println("[Serial] Pico communication on Serial2 (GPIO 16 RX, GPIO 17 TX)");
  Serial.println("[Serial] Connecting to Pico UART1 (GPIO 8 TX, GPIO 9 RX)");
  Serial.println("[Serial] Baud rate: 115200");
  
  // Small delay for Pico to initialize
  delay(500);
  
  // Send initial handshake
  Serial.println("[Pico] Sending: ESP_READY");
  PICO_SERIAL.println("ESP_READY");
  delay(100);
}

void initializeWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
  } else {
    Serial.println("\n[WiFi] ERROR: Failed to connect");
    wifiConnected = false;
  }
}

/**
 * ============= INPUT HANDLING =============
 */

void handleKeypadInput() {
  // Check each button for press
  for (int i = 0; i < 11; i++) {
    if (digitalRead(buttonPins[i]) == LOW) {  // Button pressed (active low)
      delay(20);  // Debounce
      if (digitalRead(buttonPins[i]) == LOW) {
        handleButtonPress(i);
        
        // Wait for button release
        while (digitalRead(buttonPins[i]) == LOW) {
          delay(10);
        }
        delay(20);  // Debounce release
      }
    }
  }
}

void handleButtonPress(int buttonIndex) {
  lastInteractionTime = millis();
  unsigned long currentTime = millis();
  
  // ===== TEST MODE: Press 0-0-0 to run diagnostics =====
  if (buttonIndex == 0) {
    if (currentTime - lastButtonTime > 3000) {
      // Reset sequence if more than 3 seconds elapsed
      debugSequence = "0";
    } else {
      // Add to sequence
      debugSequence += "0";
    }
    lastButtonTime = currentTime;
    
    // Check if we have 0-0-0 sequence
    if (debugSequence == "000") {
      testPicoCommunication();
      debugSequence = "";
      return;
    }
  } else {
    // Reset sequence on non-zero button
    debugSequence = "";
  }
  
  // ===== NUMERIC BUTTON (0-9) =====
  if (buttonIndex < 10) {
    // Transition from welcome to input screen on first digit
    if (currentState == STATE_WELCOME) {
      currentState = STATE_INPUT_ID;
      currentPrintId = "";
      display.clearDisplay();
      displayInputScreen();
    }
    
    // Add digit to Print ID if space available
    if (currentState == STATE_INPUT_ID && currentPrintId.length() < MAX_PRINT_ID_LENGTH) {
      currentPrintId += buttonLabels[buttonIndex];
      display.clearDisplay();
      displayInputScreen();
    }
  } 
  // ===== ENTER BUTTON =====
  else if (buttonIndex == 10) {
    if (currentState == STATE_INPUT_ID && currentPrintId.length() > 0) {
      // Submit print job
      currentState = STATE_FETCHING;
      display.clearDisplay();
      displayFetchingScreen();
      fetchPrintJob(currentPrintId);
    } else if (currentState == STATE_WELCOME) {
      // Reset when on welcome screen
      currentPrintId = "";
      display.clearDisplay();
      displayWelcomeScreen();
    }
  }
}

/**
 * ============= PICO COMMUNICATION =============
 * Active listener that continuously drains UART buffer
 */

void processPicoMessages() {
  // Drain ALL available data from Pico UART
  // This ensures no messages are lost due to timing
  while (PICO_SERIAL.available()) {
    char c = PICO_SERIAL.read();
    
    if (c == '\n') {
      // Complete message received (newline terminator)
      if (picoRxIndex > 0) {
        picoRxBuffer[picoRxIndex] = '\0';  // Null terminate string
        lastPicoMessageTime = millis();
        
        // Print received message to serial monitor
        Serial.println("[Pico] Received: " + String(picoRxBuffer));
        
        // Process message content
        String message = String(picoRxBuffer);
        
        // Track Pico connection status
        if (message.indexOf("READY") > -1 || message.indexOf("HEARTBEAT") > -1) {
          picoConnected = true;
        } 
        // Handle error messages from Pico
        else if (message.indexOf("ERROR") > -1) {
          displayErrorScreen("Printer Error: " + message);
          updatePrintJobStatus(currentPrintId, "ERROR", message);
        } 
        // Handle job completion
        else if (message.indexOf("COMPLETE") > -1) {
          displaySuccessScreen();
          updatePrintJobStatus(currentPrintId, "COMPLETED");
        }
        
        // Clear buffer for next message
        picoRxIndex = 0;
        memset(picoRxBuffer, 0, PICO_RX_BUFFER_SIZE);
      }
    } 
    else if (c == '\r') {
      // Ignore carriage returns (CR/LF handling)
      continue;
    }
    else if (picoRxIndex < PICO_RX_BUFFER_SIZE - 1) {
      // Add character to buffer
      picoRxBuffer[picoRxIndex++] = c;
    }
  }
}

/**
 * ============= DISPLAY FUNCTIONS =============
 */

void displayWelcomeScreen() {
  currentState = STATE_WELCOME;
  display.clearDisplay();
  
  // Title
  display.setTextSize(2);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(20, 10);
  display.println("PRINTOSK");
  
  // Instructions
  display.setTextSize(1);
  display.setCursor(10, 35);
  display.println("Enter Print ID");
  display.setCursor(5, 50);
  display.println("Press 0-9 then ENTER");
  
  display.display();
}

void displayInputScreen() {
  currentState = STATE_INPUT_ID;
  display.clearDisplay();
  
  // Header
  display.setTextSize(2);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(20, 10);
  display.println("PRINT ID");
  
  // Display entered ID
  display.setTextSize(2);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(30, 35);
  display.println(currentPrintId);
  
  // Counter
  display.setTextSize(1);
  display.setCursor(0, 55);
  display.println(String(currentPrintId.length()) + "/" + String(MAX_PRINT_ID_LENGTH));
  
  display.display();
}

void displayFetchingScreen() {
  currentState = STATE_FETCHING;
  display.clearDisplay();
  
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(30, 10);
  display.println("Fetching Job...");
  
  display.setCursor(15, 35);
  display.println("ID: " + currentPrintId);
  
  display.display();
}

void displayPrintingScreen() {
  currentState = STATE_PRINTING;
  display.clearDisplay();
  
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(35, 10);
  display.println("Printing...");
  
  display.setCursor(20, 35);
  display.println("Please Wait");
  
  display.display();
}

void displaySuccessScreen() {
  currentState = STATE_SUCCESS;
  display.clearDisplay();
  
  // Success message
  display.setTextSize(2);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(30, 20);
  display.println("SUCCESS!");
  
  // Info text
  display.setTextSize(1);
  display.setCursor(10, 50);
  display.println("Job Completed. Returning...");
  
  display.display();
  delay(3000);
  
  // Return to welcome screen
  currentState = STATE_WELCOME;
  display.clearDisplay();
  displayWelcomeScreen();
}

void displayErrorScreen(String message) {
  currentState = STATE_ERROR;
  display.clearDisplay();
  
  // Error header
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(25, 10);
  display.println("ERROR!");
  
  // Error message
  display.setCursor(0, 25);
  display.setTextSize(0);
  display.println(message);
  
  // Instructions
  display.setCursor(10, 50);
  display.println("Press ENTER to continue");
  
  display.display();
}

void displayIdleScreen() {
  currentState = STATE_IDLE;
  display.clearDisplay();
  
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(20, 30);
  display.println("Idle - No Input");
  
  display.display();
}

/**
 * ============= API & PICO COMMUNICATION =============
 */

void fetchPrintJob(String printId) {
  if (!wifiConnected) {
    displayErrorScreen("No WiFi Connection");
    return;
  }
  
  String url = String(API_BASE_URL) + "/print-job/" + printId;
  
  HTTPClient http;
  http.begin(url);
  http.setTimeout(API_TIMEOUT);
  
  Serial.println("[API] Fetching: " + url);
  Serial.println("[API] Waiting for response...");
  
  int httpCode = http.GET();
  Serial.println("[API] HTTP Code: " + String(httpCode));
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("[API] Response received: " + String(payload.length()) + " bytes");
    
    // Parse JSON response
    DynamicJsonDocument doc(8192);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      if (doc["success"] == true) {
        JsonObject printJob = doc["printJob"];
        JsonArray files = doc["files"];
        
        Serial.println("[API] Job found!");
        Serial.print("[API] Files: ");
        Serial.println(files.size());
        
        // Show printing screen
        currentState = STATE_PRINTING;
        display.clearDisplay();
        displayPrintingScreen();
        
        // Send print command to Pico
        String command = "START_PRINT:" + printId + ":" + String(files.size());
        sendToPico(command);
        
        // Update API status
        updatePrintJobStatus(printId, "PRINTING");
      } else {
        displayErrorScreen("Job not found");
      }
    } else {
      displayErrorScreen("Parse error");
      Serial.println("[API] JSON error: " + String(error.c_str()));
    }
  } else if (httpCode == 404) {
    displayErrorScreen("Print ID not found");
  } else if (httpCode == 410) {
    displayErrorScreen("Job expired");
  } else {
    displayErrorScreen("Error: " + String(httpCode));
  }
  
  http.end();
}

void sendToPico(String command) {
  Serial.println("[Pico] DEBUG: Preparing to send: " + command);
  delay(100);  // Small delay to ensure Pico is ready
  
  // Send command with explicit newline
  PICO_SERIAL.print(command);
  PICO_SERIAL.print("\n");
  PICO_SERIAL.flush();      // Force buffer flush
  
  delay(50);  // Wait for transmission
  
  Serial.println("[Pico] Sent: " + command);
  Serial.println("[Pico] Buffer flushed");
}

void testPicoCommunication() {
  Serial.println("\n========================================");
  Serial.println("PICO COMMUNICATION TEST");
  Serial.println("========================================");
  Serial.println("1. Checking for HEARTBEAT (should appear every 5 seconds)");
  Serial.println("2. Sending TEST_ECHO command...");
  
  sendToPico("TEST_ECHO");
  
  Serial.println("3. Waiting 5 seconds for Pico responses...");
  for (int i = 0; i < 5; i++) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nTest complete. Check serial output above.");
  Serial.println("========================================\n");
}

void updatePrintJobStatus(String printId, String status, String errorMsg) {
  if (!wifiConnected) {
    Serial.println("[API] Cannot update status - WiFi disconnected");
    return;
  }
  
  String url = String(API_BASE_URL) + "/print-job/" + printId + "/status";
  
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Build JSON payload
  DynamicJsonDocument doc(256);
  doc["status"] = status;
  if (errorMsg.length() > 0) {
    doc["error_message"] = errorMsg;
  }
  
  String jsonStr;
  serializeJson(doc, jsonStr);
  
  Serial.println("[API] Updating status: " + url + " -> " + status);
  int httpCode = http.PUT(jsonStr);
  
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("[API] Status updated successfully");
  } else {
    Serial.println("[API] Status update failed: " + String(httpCode));
  }
  
  http.end();
}

/**
 * ============= INTERRUPT HANDLER =============
 */

void IRAM_ATTR handleButtonInterrupt() {
  // Check which button is pressed
  for (int i = 0; i < 11; i++) {
    if (digitalRead(buttonPins[i]) == LOW) {
      delay(50);  // Debounce
      if (digitalRead(buttonPins[i]) == LOW) {
        handleButtonPress(i);
        delay(200);  // Debounce delay
      }
    }
  }
}

// ============= END OF ESP32 FIRMWARE =============
