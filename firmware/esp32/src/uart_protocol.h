/**
 * Printosk ESP32 - UART Protocol Handler
 * Manages communication with Pico via UART with frame-based protocol
 *
 * Protocol:
 *   [START=0xAA][LENGTH][TYPE][PAYLOAD][CRC][END=0xBB]
 */

#ifndef UART_PROTOCOL_H
#define UART_PROTOCOL_H

#include <stdint.h>

// UART message types
#define UART_MSG_PING 0x01
#define UART_MSG_PRINT_CMD 0x10
#define UART_MSG_STATUS 0x20
#define UART_MSG_ERROR 0x30
#define UART_MSG_ACK 0xFF

// Message structure
struct UARTMessage {
  uint8_t type;
  uint16_t length;
  uint8_t payload[512];
  uint8_t crc;
};

// Print command payload
struct PrintCommand {
  char job_id[37];      // UUID
  int total_pages;
  bool color;
  int copies;
  char file_url[512];   // URL to download file
  bool mock_mode;
};

// Status response payload
struct PrintStatus {
  char job_id[37];
  uint8_t status;       // STARTED=0x01, PRINTING=0x02, DONE=0x03, ERROR=0x04
  int progress;         // 0-100
  char message[256];
};

class UARTProtocol {
public:
  /**
   * Initialize UART communication
   */
  bool init(int txPin, int rxPin, int baudRate);

  /**
   * Send frame to Pico
   */
  bool sendFrame(const UARTMessage* msg);

  /**
   * Send print command
   */
  bool sendPrintCommand(const PrintCommand* cmd);

  /**
   * Read frame from Pico with timeout
   */
  int readFrame(uint8_t* buffer, int maxLen);

  /**
   * Parse received buffer into message structure
   */
  bool parseMessage(const uint8_t* buffer, int len, UARTMessage* msg);

  /**
   * Parse status response from payload
   */
  bool parseStatus(const uint8_t* payload, int len, PrintStatus* status);

  /**
   * Flush UART buffers
   */
  void flush();

private:
  uint8_t txPin;
  uint8_t rxPin;
  HardwareSerial* uartPort;

  /**
   * Calculate CRC8 checksum
   */
  uint8_t calculateCRC(const uint8_t* data, int len);

  /**
   * Verify frame integrity
   */
  bool verifyFrame(const uint8_t* buffer, int len);
};

// Global instance
extern UARTProtocol uartProtocol;

#endif // UART_PROTOCOL_H
