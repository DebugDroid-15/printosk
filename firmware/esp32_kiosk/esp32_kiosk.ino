/**
 * Printosk - ESP32 Kiosk Firmware
 * 
 * Features:
 * - WiFi connectivity
 * - Numeric keypad input (0-9 + Enter)
 * - SSD1306 OLED display
 * - REST API communication with backend
 * - USB serial communication with Pico
 * - Print job status tracking
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include "config.h"

// Display setup
Adafruit_SSD1306 display(128, 64, &Wire, -1);

// Global variables
String currentPrintId = "";
DisplayState currentState = STATE_WELCOME;
unsigned long lastInteractionTime = 0;
bool wifiConnected = false;
bool picoConnected = false;

// Button pins array
const int buttonPins[11] = {
  BUTTON_0_PIN, BUTTON_1_PIN, BUTTON_2_PIN, BUTTON_3_PIN, BUTTON_4_PIN,
  BUTTON_5_PIN, BUTTON_6_PIN, BUTTON_7_PIN, BUTTON_8_PIN, BUTTON_9_PIN,
  BUTTON_ENTER_PIN
};

const char* buttonLabels[11] = {
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "ENTER"
};

// Forward declarations
void initializeDisplay();
void initializeButtons();
void initializeSerial();
void initializeWiFi();
void handleKeypadInput();
void handleButtonPress(int buttonIndex);
void displayWelcomeScreen();
void displayInputScreen();
void displayFetchingScreen();
void displayPrintingScreen();
void displaySuccessScreen();
void displayErrorScreen(String message);
void displayIdleScreen();
void fetchPrintJob(String printId);
void sendToPico(String command);
void updatePrintJobStatus(String printId, String status, String errorMsg = "");

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n[SYSTEM] Printosk ESP32 Kiosk Starting...");
  
  initializeDisplay();
  initializeButtons();
  initializeSerial();
  initializeWiFi();
  
  display.clearDisplay();
  displayWelcomeScreen();
  
  Serial.println("[SYSTEM] Setup Complete!");
}

void loop() {
  // Check WiFi connection
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
  
  // Check Pico connection
  if (PICO_SERIAL.available()) {
    String message = PICO_SERIAL.readStringUntil('\n');
    Serial.println("[Pico] Received: " + message);
    
    if (message.indexOf("READY") > -1 || message.indexOf("TEST") > -1) {
      picoConnected = true;
      Serial.println("[Pico] Connection established!");
    } else if (message.indexOf("ERROR") > -1) {
      displayErrorScreen("Printer Error: " + message);
      updatePrintJobStatus(currentPrintId, "ERROR", message);
    } else if (message.indexOf("COMPLETE") > -1) {
      displaySuccessScreen();
      updatePrintJobStatus(currentPrintId, "COMPLETED");
    }
  }
  
  // Handle keypad input
  handleKeypadInput();
  
  // Auto-clear screen after timeout
  if (currentState != STATE_WELCOME && currentState != STATE_IDLE) {
    if (millis() - lastInteractionTime > DISPLAY_TIMEOUT) {
      currentState = STATE_WELCOME;
      display.clearDisplay();
      displayWelcomeScreen();
    }
  }
  
  delay(50);
}

void initializeDisplay() {
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDRESS)) {
    Serial.println("[Display] SSD1306 allocation failed");
    return;
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Printosk Initializing...");
  display.display();
  
  Serial.println("[Display] SSD1306 Initialized");
}

void initializeButtons() {
  for (int i = 0; i < 11; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
  }
  Serial.println("[Buttons] Initialized - 11 buttons ready");
}

void initializeSerial() {
  // Serial uses GPIO 3 (RX) and GPIO 1 (TX) by default
  // No need to pass pins for Serial object - it uses hardware default
  PICO_SERIAL.begin(PICO_BAUD_RATE);
  Serial.println("[Serial] Pico communication initialized on Serial (GPIO 3/1)");
  
  // Send initial handshake
  delay(500);
  Serial.println("[Pico] Sending: ESP_READY");
  PICO_SERIAL.println("ESP_READY");
}

void initializeWiFi() {
  Serial.print("[WiFi] Connecting to ");
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
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
  } else {
    Serial.println("\n[WiFi] Failed to connect");
    wifiConnected = false;
  }
}

void handleKeypadInput() {
  // Check each button
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
  
  if (buttonIndex < 10) {
    // Numeric button (0-9)
    if (currentState == STATE_WELCOME) {
      currentState = STATE_INPUT_ID;
      currentPrintId = "";
      display.clearDisplay();
      displayInputScreen();
    }
    
    if (currentState == STATE_INPUT_ID && currentPrintId.length() < MAX_PRINT_ID_LENGTH) {
      currentPrintId += buttonLabels[buttonIndex];
      display.clearDisplay();
      displayInputScreen();
    }
  } else if (buttonIndex == 10) {
    // Enter button
    if (currentState == STATE_INPUT_ID && currentPrintId.length() > 0) {
      currentState = STATE_FETCHING;
      display.clearDisplay();
      displayFetchingScreen();
      fetchPrintJob(currentPrintId);
    } else if (currentState == STATE_WELCOME) {
      // Reset
      currentPrintId = "";
      display.clearDisplay();
      displayWelcomeScreen();
    }
  }
}

void displayWelcomeScreen() {
  currentState = STATE_WELCOME;
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(20, 10);
  display.println("PRINTOSK");
  
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
  
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(20, 10);
  display.println("PRINT ID");
  
  display.setTextSize(1);
  display.setCursor(40, 35);
  display.println(currentPrintId);
  
  display.setCursor(0, 50);
  display.println("Entered: " + String(currentPrintId.length()) + "/" + String(MAX_PRINT_ID_LENGTH));
  
  display.display();
}

void displayFetchingScreen() {
  currentState = STATE_FETCHING;
  display.clearDisplay();
  
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
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
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(35, 10);
  display.println("Printing...");
  
  display.setCursor(20, 35);
  display.println("Please Wait");
  
  display.display();
}

void displaySuccessScreen() {
  currentState = STATE_SUCCESS;
  display.clearDisplay();
  
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(30, 20);
  display.println("SUCCESS!");
  
  display.setTextSize(1);
  display.setCursor(10, 50);
  display.println("Job Completed. Returning...");
  
  display.display();
  delay(3000);
  
  currentState = STATE_WELCOME;
  display.clearDisplay();
  displayWelcomeScreen();
}

void displayErrorScreen(String message) {
  currentState = STATE_ERROR;
  display.clearDisplay();
  
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(25, 10);
  display.println("ERROR!");
  
  display.setCursor(0, 25);
  display.setTextSize(0);
  display.println(message);
  
  display.setCursor(10, 50);
  display.println("Press ENTER to continue");
  
  display.display();
}

void displayIdleScreen() {
  currentState = STATE_IDLE;
  display.clearDisplay();
  
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(20, 30);
  display.println("Idle - No Input");
  
  display.display();
}

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
  int httpCode = http.GET();
  
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
        
        currentState = STATE_PRINTING;
        display.clearDisplay();
        displayPrintingScreen();
        
        // Send command to Pico to start printing
        String command = "START_PRINT:" + printId + ":" + String(files.size());
        sendToPico(command);
        
        updatePrintJobStatus(printId, "PRINTING");
      } else {
        displayErrorScreen("Job not found");
      }
    } else {
      displayErrorScreen("Parse error");
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
  PICO_SERIAL.println(command);
  Serial.println("[Pico] Sent: " + command);
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

// Interrupt handler for button presses
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
