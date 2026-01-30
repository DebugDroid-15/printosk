#include <stdio.h>
#include <string.h>
#include "pico/stdlib.h"
#include "hardware/uart.h"
#include "hardware/gpio.h"

// Minimal UART test - send every 1 second
#define UART_ID uart1
#define BAUD_RATE 115200
#define UART_TX_PIN 8
#define UART_RX_PIN 9
#define LED_PIN PICO_DEFAULT_LED_PIN

void setup_uart() {
    // Initialize UART1
    uart_init(UART_ID, BAUD_RATE);
    
    // Set pins
    gpio_set_function(UART_TX_PIN, GPIO_FUNC_UART);
    gpio_set_function(UART_RX_PIN, GPIO_FUNC_UART);
}

void setup_led() {
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);
}

int main() {
    setup_led();
    setup_uart();
    
    // Blink LED 5 times to show startup
    for (int i = 0; i < 5; i++) {
        gpio_put(LED_PIN, 1);
        sleep_ms(100);
        gpio_put(LED_PIN, 0);
        sleep_ms(100);
    }
    
    // Send startup message MULTIPLE times
    for (int i = 0; i < 10; i++) {
        uart_puts(UART_ID, "PICO_START\n");
        sleep_ms(100);
    }
    
    // Main loop - send test message EVERY 500ms (more frequently)
    int counter = 0;
    while (1) {
        char msg[64];
        sprintf(msg, "PICO_TEST_%d\n", counter++);
        uart_puts(UART_ID, msg);
        
        // Blink LED once per message
        gpio_put(LED_PIN, 1);
        sleep_ms(50);
        gpio_put(LED_PIN, 0);
        
        sleep_ms(500);  // Every 500ms instead of 1000ms
    }
    
    return 0;
}
