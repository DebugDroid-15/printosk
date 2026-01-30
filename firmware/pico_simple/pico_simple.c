#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/uart.h"
#include "hardware/gpio.h"

// UART Configuration for ESP32 Communication
#define UART_ID uart1
#define BAUD_RATE 115200
#define UART_TX_PIN 8
#define UART_RX_PIN 9

// LED Pin (built-in Pico LED)
#define LED_PIN PICO_DEFAULT_LED_PIN

// Buffer for receiving commands
char rx_buffer[256];
int rx_index = 0;

void init_uart() {
    // Initialize UART1 at 115200 baud
    uart_init(UART_ID, BAUD_RATE);
    
    // Set GPIO pins for UART
    gpio_set_function(UART_TX_PIN, GPIO_FUNC_UART);
    gpio_set_function(UART_RX_PIN, GPIO_FUNC_UART);
    
    // Enable UART interrupt
    uart_set_irq_enabled(UART_ID, UART_IRQ_RX, true);
}

void init_gpio() {
    // Initialize LED
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);
    
    // Blink LED to show Pico is ready
    gpio_put(LED_PIN, 1);
    sleep_ms(200);
    gpio_put(LED_PIN, 0);
    sleep_ms(200);
    gpio_put(LED_PIN, 1);
    sleep_ms(200);
    gpio_put(LED_PIN, 0);
}

void send_to_esp32(const char *message) {
    uart_puts(UART_ID, message);
    uart_puts(UART_ID, "\n");
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
    
    // Send startup message
    send_to_esp32("PICO_INITIALIZED");
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
