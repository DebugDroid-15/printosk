#include <stdio.h>
#include <string.h>
#include "pico/stdlib.h"
#include "hardware/uart.h"
#include "hardware/gpio.h"

// ESP32 Communication - Hardware UART1 on GPIO 8 (TX) and GPIO 9 (RX)
#define ESP32_UART_ID uart1
#define ESP32_BAUD_RATE 115200
#define ESP32_TX_PIN 8
#define ESP32_RX_PIN 9

// Printer Communication - Hardware UART0 on GPIO 0 (TX) and GPIO 1 (RX)
// Note: USB printer communicates via TX/RX (UART protocol over USB)
#define PRINTER_UART_ID uart0
#define PRINTER_BAUD_RATE 115200
#define PRINTER_TX_PIN 0
#define PRINTER_RX_PIN 1

#define LED_PIN PICO_DEFAULT_LED_PIN
#define RX_BUFFER_SIZE 256

char esp32_rx_buffer[RX_BUFFER_SIZE];
int esp32_rx_index = 0;

// ESC/POS Commands for EPSON L3115
#define ESC 0x1B
#define GS 0x1D
#define DC2 0x12

void uart_puts(uart_inst_t *uart, const char *str) {
    for (int i = 0; str[i]; i++) {
        uart_putc(uart, str[i]);
    }
}

void uart_write_bytes(uart_inst_t *uart, const uint8_t *data, int len) {
    for (int i = 0; i < len; i++) {
        uart_putc(uart, data[i]);
    }
}

void setup_esp32_uart() {
    uart_init(ESP32_UART_ID, ESP32_BAUD_RATE);
    gpio_set_function(ESP32_TX_PIN, GPIO_FUNC_UART);
    gpio_set_function(ESP32_RX_PIN, GPIO_FUNC_UART);
    uart_set_fifo_enabled(ESP32_UART_ID, true);
}

void setup_printer_uart() {
    uart_init(PRINTER_UART_ID, PRINTER_BAUD_RATE);
    gpio_set_function(PRINTER_TX_PIN, GPIO_FUNC_UART);
    gpio_set_function(PRINTER_RX_PIN, GPIO_FUNC_UART);
    uart_set_fifo_enabled(PRINTER_UART_ID, true);
}

void setup_led() {
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);
}

void led_blink(int times, int delay_ms) {
    for (int i = 0; i < times; i++) {
        gpio_put(LED_PIN, 1);
        sleep_ms(delay_ms);
        gpio_put(LED_PIN, 0);
        sleep_ms(delay_ms);
    }
}

// ESC/POS: Initialize printer
void printer_init() {
    uint8_t init_cmd[] = {ESC, '@'};
    uart_write_bytes(PRINTER_UART_ID, init_cmd, 2);
    sleep_ms(100);
}

// ESC/POS: Set text alignment (0=left, 1=center, 2=right)
void printer_set_align(int align) {
    uint8_t cmd[] = {ESC, 'a', (uint8_t)align};
    uart_write_bytes(PRINTER_UART_ID, cmd, 3);
}

// ESC/POS: Set font size (0=normal, 1=double width, 2=double height, 3=double both)
void printer_set_size(int size) {
    uint8_t cmd[] = {GS, '!', (uint8_t)size};
    uart_write_bytes(PRINTER_UART_ID, cmd, 3);
}

// ESC/POS: Bold on/off
void printer_set_bold(int on) {
    uint8_t cmd[] = {ESC, 'E', (uint8_t)on};
    uart_write_bytes(PRINTER_UART_ID, cmd, 3);
}

// ESC/POS: Line feed
void printer_linefeed(int lines) {
    for (int i = 0; i < lines; i++) {
        uart_putc(PRINTER_UART_ID, '\n');
    }
    sleep_ms(50);
}

// ESC/POS: Cut paper
void printer_cut() {
    uint8_t cmd[] = {GS, 'V', 0x00};
    uart_write_bytes(PRINTER_UART_ID, cmd, 3);
    sleep_ms(200);
}

// Send text to printer
void printer_text(const char *text) {
    uart_puts(PRINTER_UART_ID, text);
    sleep_ms(50);
}

// TEST: Send raw bytes to printer to verify UART works
void test_printer_uart() {
    uart_puts(ESP32_UART_ID, "[Pico] TEST: Sending test byte to printer...\n");
    
    // Send ESC character (0x1B) as test
    uart_putc(PRINTER_UART_ID, 0x1B);
    uart_putc(PRINTER_UART_ID, '@');
    
    uart_puts(ESP32_UART_ID, "[Pico] TEST: Sent ESC @ to printer\n");
    sleep_ms(500);
    
    // Try simple text
    uart_puts(ESP32_UART_ID, "[Pico] TEST: Sending 'TEST' to printer...\n");
    uart_puts(PRINTER_UART_ID, "TEST\n\n");
    sleep_ms(500);
    uart_puts(ESP32_UART_ID, "[Pico] TEST: Complete\n");
}

// Parse and execute START_PRINT command
void handle_print_command(const char *command) {
    // Command format: START_PRINT:jobid:filecount
    char job_id[32];
    int file_count = 0;
    
    uart_puts(ESP32_UART_ID, "[Pico] ===== PRINT COMMAND RECEIVED =====\n");
    uart_puts(ESP32_UART_ID, "[Pico] Command: ");
    uart_puts(ESP32_UART_ID, command);
    uart_puts(ESP32_UART_ID, "\n");
    
    if (sscanf(command, "START_PRINT:%31[^:]:%d", job_id, &file_count) == 2) {
        uart_puts(ESP32_UART_ID, "[Pico] [OK] Command parsed\n");
        uart_puts(ESP32_UART_ID, "[Pico] [OK] Job: ");
        uart_puts(ESP32_UART_ID, job_id);
        uart_puts(ESP32_UART_ID, " Files: ");
        char temp[16];
        sprintf(temp, "%d\n", file_count);
        uart_puts(ESP32_UART_ID, temp);
        
        led_blink(3, 100);
        
        // TEST: Verify UART0 is working
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 1] Testing UART0 connection...\n");
        test_printer_uart();
        
        sleep_ms(1000);
        
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 2] Initializing printer...\n");
        printer_init();
        sleep_ms(500);
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 2] Init complete\n");
        
        // Print header
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 3] Sending alignment...\n");
        printer_set_align(1);
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 4] Setting bold...\n");
        printer_set_bold(1);
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 5] Setting size...\n");
        printer_set_size(0x11);
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 6] Printing header...\n");
        printer_text("PRINTOSK\n");
        printer_set_bold(0);
        printer_set_size(0);
        printer_linefeed(1);
        
        // Print job info
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 7] Printing job info...\n");
        printer_set_align(0);
        printer_text("Job ID: ");
        printer_text(job_id);
        printer_text("\n");
        
        char file_info[64];
        sprintf(file_info, "Files: %d\n", file_count);
        printer_text(file_info);
        printer_text("Status: PRINTING\n");
        printer_linefeed(2);
        
        // Print footer
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 8] Printing footer...\n");
        printer_set_align(1);
        printer_text("Thank you for printing!\n");
        printer_linefeed(1);
        
        // Cut paper
        uart_puts(ESP32_UART_ID, "[Pico] [STEP 9] Cutting paper...\n");
        printer_cut();
        
        // Notify ESP32
        uart_puts(ESP32_UART_ID, "[Pico] [COMPLETE] Print job finished!\n");
        uart_puts(ESP32_UART_ID, "[Pico] ===== END PRINT COMMAND =====\n");
        led_blink(2, 200);
    } else {
        uart_puts(ESP32_UART_ID, "[Pico] [ERROR] Failed to parse command format\n");
    }
}

// Process ESP32 command buffer
void process_command(const char *buffer) {
    if (strstr(buffer, "ESP_READY")) {
        uart_puts(ESP32_UART_ID, "PICO_READY\n");
    } 
    else if (strstr(buffer, "START_PRINT")) {
        handle_print_command(buffer);
    }
    else if (strlen(buffer) > 0) {
        uart_puts(ESP32_UART_ID, "[Pico] Unknown command: ");
        uart_puts(ESP32_UART_ID, buffer);
        uart_puts(ESP32_UART_ID, "\n");
    }
}

int main() {
    setup_led();
    setup_esp32_uart();
    setup_printer_uart();
    
    // Blink LED 5 times at startup
    led_blink(5, 100);
    
    // Send initialization message
    uart_puts(ESP32_UART_ID, "PICO_INITIALIZED\n");
    sleep_ms(100);
    uart_puts(ESP32_UART_ID, "WAITING_FOR_ESP32\n");
    
    // Main loop - listen for commands from ESP32
    memset(esp32_rx_buffer, 0, RX_BUFFER_SIZE);
    
    while (1) {
        if (uart_is_readable(ESP32_UART_ID)) {
            char c = uart_getc(ESP32_UART_ID);
            
            if (c == '\n') {
                // Command complete
                if (esp32_rx_index > 0) {
                    esp32_rx_buffer[esp32_rx_index] = '\0';
                    process_command(esp32_rx_buffer);
                    memset(esp32_rx_buffer, 0, RX_BUFFER_SIZE);
                    esp32_rx_index = 0;
                }
            } 
            else if (c == '\r') {
                // Ignore carriage return
                continue;
            }
            else if (esp32_rx_index < RX_BUFFER_SIZE - 1) {
                esp32_rx_buffer[esp32_rx_index++] = c;
            }
        }
        
        sleep_ms(10);
    }
    
    return 0;
}
