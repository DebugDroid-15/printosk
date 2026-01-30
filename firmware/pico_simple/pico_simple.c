#include <stdio.h>
#include <string.h>
#include "pico/stdlib.h"
#include "hardware/uart.h"
#include "hardware/gpio.h"

// UART Configuration for ESP32 Communication
// Test with UART0 on GPIO 0 (RX) and GPIO 1 (TX)
// If GPIO 8/9 doesn't work, try these pins
#define UART_ID uart0
#define BAUD_RATE 115200
#define UART_TX_PIN 1   // GPIO 1 = UART0 TX (to ESP32 RX at GPIO 16)
#define UART_RX_PIN 0   // GPIO 0 = UART0 RX (from ESP32 TX at GPIO 17)

// LED Pin (built-in Pico LED)
#define LED_PIN PICO_DEFAULT_LED_PIN

// Buffer for receiving commands
char rx_buffer[256];
int rx_index = 0;
bool pico_ready = false;

void init_uart() {
    // Initialize UART1 at 115200 baud
    uart_init(UART_ID, BAUD_RATE);
    
    // Set GPIO pins for UART1
    // GPIO 8 = UART1 TX, GPIO 9 = UART1 RX
    gpio_set_function(UART_TX_PIN, GPIO_FUNC_UART);
    gpio_set_function(UART_RX_PIN, GPIO_FUNC_UART);
    
    // Optional: Set up GPIO pins (no pull-ups needed for UART)
    // gpio_pull_up(UART_RX_PIN);  // Pull-up on RX line (optional)
}

void init_gpio() {
    // Initialize LED
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);
    
    // Blink LED to show Pico is ready (3 blinks)
    for (int i = 0; i < 3; i++) {
        gpio_put(LED_PIN, 1);
        sleep_ms(200);
        gpio_put(LED_PIN, 0);
        sleep_ms(200);
    }
}

void send_to_esp32(const char *message) {
    uart_puts(UART_ID, message);
    uart_puts(UART_ID, "\n");
    uart_tx_wait_blocking(UART_ID);  // Wait for transmission to complete
}

void handle_command(const char *cmd) {
    // Remove newline from command
    char command[256];
    sscanf(cmd, "%255s", command);
    
    if (strcmp(command, "ESP_READY") == 0) {
        // ESP32 is ready, acknowledge
        send_to_esp32("PICO_READY");
        gpio_put(LED_PIN, 1);
        sleep_ms(100);
        gpio_put(LED_PIN, 0);
    }
    else if (strstr(command, "START_PRINT") != NULL) {
        // Parse: START_PRINT:printId:fileCount
        int print_id = 0;
        int file_count = 0;
        sscanf(command, "START_PRINT:%d:%d", &print_id, &file_count);
        
        // Send status to ESP32
        char response[128];
        sprintf(response, "PRINTING:%d", print_id);
        send_to_esp32(response);
        
        // Simulate printing with LED blink
        for (int i = 0; i < 5; i++) {
            gpio_put(LED_PIN, 1);
            sleep_ms(100);
            gpio_put(LED_PIN, 0);
            sleep_ms(100);
        }
        
        // Send completion status
        sprintf(response, "COMPLETE:%d", print_id);
        send_to_esp32(response);
    }
    else if (strstr(command, "CANCEL") != NULL) {
        send_to_esp32("CANCELLED");
        gpio_put(LED_PIN, 0);
    }
    else if (strcmp(command, "STATUS") == 0) {
        send_to_esp32("PICO_OK");
    }
    else if (strcmp(command, "PING") == 0) {
        send_to_esp32("PONG");
    }
    else {
        // Unknown command
        send_to_esp32("ERROR_UNKNOWN");
    }
}

int main() {
    // Initialize stdio for debugging
    stdio_init_all();
    
    // Initialize peripherals
    init_gpio();
    init_uart();
    
    // Give UART time to stabilize
    sleep_ms(1000);
    
    // Send startup message
    send_to_esp32("PICO_INITIALIZED");
    sleep_ms(100);
    send_to_esp32("WAITING_FOR_ESP32");
    
    // Blink LED rapidly to indicate ready
    for (int i = 0; i < 3; i++) {
        gpio_put(LED_PIN, 1);
        sleep_ms(50);
        gpio_put(LED_PIN, 0);
        sleep_ms(50);
    }
    
    // Main loop - listen for commands from ESP32
    while (true) {
        if (uart_is_readable(UART_ID)) {
            char c = uart_getc(UART_ID);
            
            if (c == '\n' || c == '\r') {
                if (rx_index > 0) {
                    rx_buffer[rx_index] = '\0';
                    handle_command(rx_buffer);
                    rx_index = 0;
                }
            } else if (rx_index < 255) {
                rx_buffer[rx_index++] = c;
            }
        }
        
        sleep_ms(1);
    }
    
    return 0;
}
