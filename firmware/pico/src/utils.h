/**
 * Printosk Pico - Utility Functions
 * Logging, memory, helpers
 */

#ifndef PICO_UTILS_H
#define PICO_UTILS_H

#include <stdio.h>

// Debug logging macros
#if ENABLE_DEBUG_LOGS
  #define log_info(fmt, ...) \
    printf("[INFO] " fmt, ##__VA_ARGS__)
  
  #define log_debug(fmt, ...) \
    printf("[DEBUG] " fmt, ##__VA_ARGS__)
  
  #define log_warn(fmt, ...) \
    printf("[WARN] " fmt, ##__VA_ARGS__)
  
  #define log_error(fmt, ...) \
    printf("[ERROR] " fmt, ##__VA_ARGS__)
#else
  #define log_info(fmt, ...)
  #define log_debug(fmt, ...)
  #define log_warn(fmt, ...)
  #define log_error(fmt, ...)
#endif

/**
 * Get free SRAM
 */
uint32_t get_free_sram();

/**
 * Delay with watchdog care
 */
void safe_sleep_ms(uint32_t ms);

/**
 * CRC8 checksum
 */
uint8_t crc8(const uint8_t* data, int len);

/**
 * String utilities
 */
int safe_strlen(const char* str, int max_len);
void safe_strncpy(char* dest, const char* src, int dest_size);

#endif // PICO_UTILS_H
