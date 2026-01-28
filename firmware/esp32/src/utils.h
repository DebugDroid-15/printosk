/**
 * Printosk ESP32 - Utility Functions
 * Logging, memory management, string helpers
 */

#ifndef UTILS_H
#define UTILS_H

#include <string>
#include <cstdarg>

// Logging macros
void log_internal(const char* level, const char* format, va_list args);

#define log_debug(fmt, ...) \
  do { \
    if (LOG_LEVEL_DEBUG) { \
      va_list args; \
      va_start(args, fmt); \
      log_internal("DEBUG", fmt, args); \
      va_end(args); \
    } \
  } while(0)

#define log_info(fmt, ...) \
  do { \
    va_list args; \
    va_start(args, fmt); \
    log_internal("INFO", fmt, args); \
    va_end(args); \
  } while(0)

#define log_warn(fmt, ...) \
  do { \
    va_list args; \
    va_start(args, fmt); \
    log_internal("WARN", fmt, args); \
    va_end(args); \
  } while(0)

#define log_error(fmt, ...) \
  do { \
    va_list args; \
    va_start(args, fmt); \
    log_internal("ERROR", fmt, args); \
    va_end(args); \
  } while(0)

/**
 * Get device unique ID (MAC address)
 */
std::string get_device_id();

/**
 * Get free heap memory
 */
uint32_t get_free_heap();

/**
 * Get largest contiguous free block
 */
uint32_t get_max_alloc_heap();

/**
 * Format bytes to human-readable string
 */
std::string format_bytes(uint32_t bytes);

/**
 * Get current time as ISO 8601 string
 */
std::string get_iso_timestamp();

/**
 * URL encode string
 */
std::string url_encode(const std::string& str);

/**
 * URL decode string
 */
std::string url_decode(const std::string& str);

/**
 * Generate random number
 */
uint32_t random_between(uint32_t min, uint32_t max);

/**
 * Delay with watchdog kicks (prevents WDT reset)
 */
void safe_delay(uint32_t ms);

#endif // UTILS_H
