/**
 * Printosk Pico - Printer Interface Abstraction
 * Handles USB printer communication via libusb wrapper
 *
 * Supports:
 * - Epson ESC/P protocol
 * - HP PCL protocol
 * - PostScript (via CUPS filters)
 */

#ifndef PICO_PRINTER_H
#define PICO_PRINTER_H

#include <stdint.h>
#include <stdbool.h>

// Print job structure
typedef struct {
  char job_id[37];
  int total_pages;
  bool color;
  int copies;
} PrintJob;

// Printer controller state
typedef struct {
  uint16_t vendor_id;
  uint16_t product_id;
  int device_handle;
  bool connected;
  bool printing;
  int pages_printed;
} PrinterController;

/**
 * Initialize printer subsystem
 * Scans for USB printers and sets up drivers
 */
bool printer_init(PrinterController* controller);

/**
 * Connect to first available printer
 */
bool printer_connect(PrinterController* controller);

/**
 * Send print job to printer
 * Blocks until complete or error
 */
bool printer_print(PrinterController* controller, const PrintJob* job);

/**
 * Get printer status
 */
bool printer_get_status(PrinterController* controller, char* status, int status_len);

/**
 * Cancel current print job
 */
bool printer_cancel(PrinterController* controller);

/**
 * Disconnect from printer
 */
void printer_disconnect(PrinterController* controller);

#endif // PICO_PRINTER_H
