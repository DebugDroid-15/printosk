#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/uart.h"

int main() {
    stdio_init_all();
    
    // Blink LED continuously
    gpio_init(PICO_DEFAULT_LED_PIN);
    gpio_set_dir(PICO_DEFAULT_LED_PIN, GPIO_OUT);
    
    int count = 0;
    while (1) {
        gpio_put(PICO_DEFAULT_LED_PIN, 1);
        sleep_ms(500);
        gpio_put(PICO_DEFAULT_LED_PIN, 0);
        sleep_ms(500);
        
        printf("Pico alive! Count: %d\n", count++);
    }
    
    return 0;
}
