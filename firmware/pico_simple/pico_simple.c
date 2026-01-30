#include <stdio.h>
#include <string.h>
#include "pico/stdlib.h"
#include "hardware/gpio.h"

// Software UART using GPIO bit-banging
// GPIO 2 = TX (to ESP32 RX at GPIO 16)
#define SW_TX_PIN 2
#define BAUD_RATE 115200
#define BIT_TIME_US (1000000 / BAUD_RATE)
#define LED_PIN PICO_DEFAULT_LED_PIN

void setup_gpio() {
    gpio_init(SW_TX_PIN);
    gpio_set_dir(SW_TX_PIN, GPIO_OUT);
    gpio_put(SW_TX_PIN, 1);  // Idle high
    
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);
}

// Software UART TX - send one byte
void sw_uart_putc(char c) {
    // Start bit (low)
    gpio_put(SW_TX_PIN, 0);
    sleep_us(BIT_TIME_US);
    
    // Data bits (LSB first)
    for (int i = 0; i < 8; i++) {
        gpio_put(SW_TX_PIN, (c >> i) & 1);
        sleep_us(BIT_TIME_US);
    }
    
    // Stop bit (high)
    gpio_put(SW_TX_PIN, 1);
    sleep_us(BIT_TIME_US);
}

// Send string
void sw_uart_puts(const char *str) {
    for (int i = 0; str[i]; i++) {
        sw_uart_putc(str[i]);
    }
}

int main() {
    setup_gpio();
    
    // Blink LED 5 times to show startup
    for (int i = 0; i < 5; i++) {
        gpio_put(LED_PIN, 1);
        sleep_ms(100);
        gpio_put(LED_PIN, 0);
        sleep_ms(100);
    }
    
    // Send startup message MULTIPLE times
    for (int i = 0; i < 10; i++) {
        sw_uart_puts("PICO_START\n");
        sleep_ms(100);
    }
    
    // Main loop - send test message every 500ms
    int counter = 0;
    while (1) {
        char msg[64];
        sprintf(msg, "PICO_TEST_%d\n", counter++);
        sw_uart_puts(msg);
        
        // Blink LED once per message
        gpio_put(LED_PIN, 1);
        sleep_ms(50);
        gpio_put(LED_PIN, 0);
        
        sleep_ms(500);
    }
    
    return 0;
}
