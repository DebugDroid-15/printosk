/**
 * Printosk Pico - Command Parser
 * Parses JSON print commands from ESP32
 */

#ifndef PICO_COMMAND_PARSER_H
#define PICO_COMMAND_PARSER_H

#include <stdint.h>
#include <stdbool.h>
#include "uart.h"

// Error codes
#define PARSE_ERR_INVALID_FRAME 1
#define PARSE_ERR_INVALID_JSON 2
#define PARSE_ERR_MISSING_FIELD 3
#define PARSE_ERR_INVALID_TYPE 4

/**
 * Parse incoming buffer as JSON command
 * Returns success status and parsed command
 */
ParseResult parse_command(const uint8_t* buffer, int buffer_len);

/**
 * Validate print command for correctness
 */
bool validate_print_command(const PrintCommand* cmd);

/**
 * Create error response string
 */
void create_error_response(int error_code, char* message, int msg_len);

#endif // PICO_COMMAND_PARSER_H
