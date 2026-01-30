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
#define PRINTER_UART_ID uart0
#define PRINTER_BAUD_RATE 115200
#define PRINTER_TX_PIN 0
#define PRINTER_RX_PIN 1

#define LED_PIN PICO_DEFAULT_LED_PIN

void uart_puts(uart_inst_t *uart, const char *str) {
    for (int i = 0; str[i]; i++) {
        uart_putc(uart, str[i]);
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

int main() {
    setup_led();
    setup_esp32_uart();
    setup_printer_uart();
    
    // Blink LED to show startup
    for (int i = 0; i < 5; i++) {
        gpio_put(LED_PIN, 1);
        sleep_ms(100);
        gpio_put(LED_PIN, 0);
        sleep_ms(100);
    }
    
    uart_puts(ESP32_UART_ID, "\n[Pico] UART Bridge Test Started\n");
    uart_puts(ESP32_UART_ID, "[Pico] UART0 (Printer) Ready at GPIO 0/1\n");
    uart_puts(ESP32_UART_ID, "[Pico] UART1 (ESP32) Ready at GPIO 8/9\n");
    uart_puts(ESP32_UART_ID, "[Pico] Send 'TEST' to print test receipt\n\n");
    
    while (1) {
        // Read from ESP32
        if (uart_is_readable(ESP32_UART_ID)) {
            char c = uart_getc(ESP32_UART_ID);
            
            // Echo to printer (testing connection)
            uart_putc(PRINTER_UART_ID, c);
            
            // Also echo back to ESP32
            uart_putc(ESP32_UART_ID, c);
            
            // Blink on each character
            if (c != '\r') {
                gpio_put(LED_PIN, 1);
                sleep_us(50);
                gpio_put(LED_PIN, 0);
            }
        }
        
        sleep_ms(1);
    }
    
    return 0;
}
