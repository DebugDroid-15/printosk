/**
 * Printosk Pico - USB Printer Driver
 * Low-level USB communication with network printers
 */

#ifndef PICO_USB_PRINTER_H
#define PICO_USB_PRINTER_H

#include <stdint.h>
#include <stdbool.h>

// USB endpoints for typical printers
#define USB_PRINTER_CLASS 0x07
#define USB_PRINTER_SUBCLASS 0x01
#define USB_PRINTER_PROTOCOL 0x02  // Bidirectional

// EPP (Epson Positioning Protocol) commands
#define ESC_INITIALIZE "\033@"
#define ESC_RESET "\033\0300"
#define ESC_COLOR_MODE_BW "\0330\0330"
#define ESC_COLOR_MODE_RGB "\033\0331"

/**
 * Enumerate USB devices and find printer
 */
bool usb_printer_find(uint16_t* vid, uint16_t* pid);

/**
 * Open USB printer device
 */
bool usb_printer_open(uint16_t vid, uint16_t pid, int* handle);

/**
 * Send data to printer
 */
bool usb_printer_write(int handle, const uint8_t* data, int len, int timeout_ms);

/**
 * Read response from printer
 */
int usb_printer_read(int handle, uint8_t* data, int len, int timeout_ms);

/**
 * Check printer status via control transfer
 */
bool usb_printer_get_status(int handle, uint8_t* status);

/**
 * Close USB printer device
 */
void usb_printer_close(int handle);

#endif // PICO_USB_PRINTER_H
