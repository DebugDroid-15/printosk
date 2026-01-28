/**
 * Printosk ESP32 - OLED Display Manager
 * Handles SSD1306 OLED display updates via I2C
 */

#ifndef DISPLAY_H
#define DISPLAY_H

#include <Adafruit_SSD1306.h>
#include "state_machine.h"

class DisplayManager {
public:
  /**
   * Initialize OLED display
   */
  bool init();

  /**
   * Update display based on current state machine state
   */
  void updateDisplay(StateMachine* fsm);

  /**
   * Show simple message on display
   */
  void showMessage(const char* message);

  /**
   * Show print job details
   */
  void showJobDetails(const char* printId, int copies, bool color);

  /**
   * Show printing progress
   */
  void showProgress(int current, int total);

  /**
   * Show error message
   */
  void showError(const char* errorMsg);

  /**
   * Clear display
   */
  void clear();

private:
  Adafruit_SSD1306 display;
  uint32_t lastUpdateTime;
  char displayedMessage[256];

  /**
   * Draw header with WiFi/battery status
   */
  void drawHeader();

  /**
   * Draw footer with navigation hints
   */
  void drawFooter(const char* hint);

  /**
   * Draw centered text
   */
  void drawCenteredText(const char* text, int y, int textSize = 1);
};

// Global instance
extern DisplayManager displayManager;

#endif // DISPLAY_H
