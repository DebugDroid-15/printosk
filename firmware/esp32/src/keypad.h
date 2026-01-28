/**
 * Printosk ESP32 - Keypad Manager
 * Handles 4x4 numeric keypad input with debouncing
 */

#ifndef KEYPAD_H
#define KEYPAD_H

#include <stdint.h>

class KeypadManager {
public:
  /**
   * Initialize keypad
   */
  bool init();

  /**
   * Read key press with debouncing
   * Returns character ('0'-'9', 'E'=Enter, 'B'=Backspace, '\0'=none)
   */
  char readKey();

  /**
   * Clear all key states
   */
  void reset();

private:
  uint8_t rowPins[4];
  uint8_t colPins[4];
  const char* keyLayout;  // "123E456B789U*0#D"

  /**
   * Scan keypad matrix and return key character
   */
  char scanMatrix();

  /**
   * Debounce key press
   */
  bool debounceKey();
};

// Global instance
extern KeypadManager keypadManager;

#endif // KEYPAD_H
