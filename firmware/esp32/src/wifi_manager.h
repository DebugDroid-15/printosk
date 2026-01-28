/**
 * Printosk ESP32 - WiFi Manager
 * Handles WiFi connectivity and reconnection
 */

#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>
#include <string>

class WiFiManager {
public:
  /**
   * Initialize WiFi in station mode
   */
  bool init(const char* ssid, const char* password);

  /**
   * Connect to WiFi
   */
  bool connect(const char* ssid, const char* password);

  /**
   * Check if WiFi is currently connected
   */
  bool isConnected();

  /**
   * Get current signal strength (RSSI)
   */
  int getSignalStrength();

  /**
   * Get local IP address
   */
  std::string getLocalIP();

  /**
   * Disconnect from WiFi
   */
  void disconnect();

private:
  wifi_mode_t mode;
  uint32_t lastConnectAttempt;
};

// Global instance
extern WiFiManager WiFiManager;

#endif // WIFI_MANAGER_H
