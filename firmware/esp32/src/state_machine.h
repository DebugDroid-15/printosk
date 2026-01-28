/**
 * Printosk ESP32 - State Machine (FSM)
 * Manages print job lifecycle: IDLE → FETCHING → PRINTING → DONE/ERROR
 */

#ifndef STATE_MACHINE_H
#define STATE_MACHINE_H

#include <stdint.h>
#include <time.h>

// FSM States
enum PrintState {
  STATE_IDLE,      // Waiting for Print ID input
  STATE_FETCHING,  // Fetching job from Supabase
  STATE_VALIDATING,// Validating job details, showing confirmation
  STATE_PRINTING,  // Printing in progress
  STATE_DONE,      // Print completed successfully
  STATE_ERROR,     // Error occurred
  STATE_CLEANUP    // Cleaning up after print
};

// Forward declarations
class SupabaseClient;
class UARTProtocol;
class DisplayManager;
struct PrintJob;
struct UARTMessage;

class StateMachine {
public:
  /**
   * Initialize state machine
   */
  void init(SupabaseClient* supabase, UARTProtocol* uart, DisplayManager* display);

  /**
   * Get current state
   */
  PrintState getCurrentState();

  /**
   * Check if state changed since last check
   */
  bool hasStateChanged();

  /**
   * Handle numeric keypad input
   */
  void handleKeyInput(char key);

  /**
   * Handle response from UART (Pico status)
   */
  void handleUARTResponse(UARTMessage* response);

  /**
   * Update state machine (called periodically)
   */
  void update();

private:
  PrintState currentState;
  PrintState previousState;
  uint32_t stateEntryTime;
  
  // Input buffer for Print ID entry
  char printIdBuffer[7];     // 6 digits + null terminator
  int printIdLength;
  uint32_t lastInputTime;
  
  // Current job data
  PrintJob currentJob;
  bool jobLoaded;

  // Client references
  SupabaseClient* supabase;
  UARTProtocol* uart;
  DisplayManager* display;

  // State handlers (private)
  void handleStateIdle();
  void handleStateFetching();
  void handleStateValidating();
  void handleStatePrinting();
  void handleStateDone();
  void handleStateError();

  /**
   * Transition to new state
   */
  void transitionTo(PrintState newState);

  /**
   * Reset input buffer
   */
  void resetInputBuffer();

  /**
   * Validate Print ID (check if exists in Supabase)
   */
  bool validateAndFetchJob(const char* printId);

  /**
   * Send print command to Pico via UART
   */
  bool sendPrintCommandToPico();

  /**
   * Update job status in Supabase
   */
  bool updateJobStatusInSupabase(const char* status, const char* message = NULL);
};

// Global instance
extern StateMachine stateMachine;

#endif // STATE_MACHINE_H
