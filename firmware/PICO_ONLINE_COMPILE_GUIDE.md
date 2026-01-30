# Pico Firmware Upload - Online IDE Method

## QUICKEST WAY (10 minutes, no installation!)

### Step 1: Open Online Pico IDE
```
Go to: https://wokwi.com/pi/pico
Or: https://github.com/raspberrypi/pico-setup-windows
```

### Step 2: Copy Simplified Pico Code

**Copy this entire code:**

```c
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
    uart_init(UART_ID, BAUD_RATE);
    gpio_set_function(UART_TX_PIN, GPIO_FUNC_UART);
    gpio_set_function(UART_RX_PIN, GPIO_FUNC_UART);
    uart_set_irq_enabled(UART_ID, UART_IRQ_RX, true);
}

void init_gpio() {
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);
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
    char command[256];
    sscanf(cmd, "%255s", command);
    
    if (strcmp(command, "ESP_READY") == 0) {
        send_to_esp32("PICO_READY");
        gpio_put(LED_PIN, 1);
        sleep_ms(100);
        gpio_put(LED_PIN, 0);
    }
    else if (strstr(command, "START_PRINT") != NULL) {
        int print_id = 0;
        int file_count = 0;
        sscanf(command, "START_PRINT:%d:%d", &print_id, &file_count);
        
        char response[128];
        sprintf(response, "PRINTING:%d", print_id);
        send_to_esp32(response);
        
        for (int i = 0; i < 5; i++) {
            gpio_put(LED_PIN, 1);
            sleep_ms(100);
            gpio_put(LED_PIN, 0);
            sleep_ms(100);
        }
        
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
        send_to_esp32("ERROR_UNKNOWN");
    }
}

int main() {
    stdio_init_all();
    init_gpio();
    init_uart();
    
    send_to_esp32("PICO_INITIALIZED");
    send_to_esp32("WAITING_FOR_ESP32");
    
    for (int i = 0; i < 3; i++) {
        gpio_put(LED_PIN, 1);
        sleep_ms(50);
        gpio_put(LED_PIN, 0);
        sleep_ms(50);
    }
    
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
```

### Step 3: Paste into Online IDE
```
1. Open: https://wokwi.com/pi/pico
2. Delete the default code
3. Paste the code above
4. Click "Run" or "Build"
```

### Step 4: Download UF2
```
When compilation completes:
1. Look for "Download" button
2. Click it
3. File "firmware.uf2" will download
4. Save to Desktop
```

### Step 5: Upload to Pico
```
1. Hold BOOTSEL button on Pico
2. Connect Pico to PC via USB (while holding BOOTSEL)
3. Release BOOTSEL after 2 seconds
4. Pico appears as "RPI-RP2" drive
5. Drag firmware.uf2 to RPI-RP2 drive
6. Pico automatically reboots
7. Done! ✓
```

---

## What This Firmware Does

| Command | Response | Action |
|---------|----------|--------|
| ESP_READY | PICO_READY | Pico acknowledges ESP32 |
| START_PRINT:ID:COUNT | PRINTING:ID | Start print job |
| | COMPLETE:ID | Print done |
| CANCEL | CANCELLED | Stop printing |
| STATUS | PICO_OK | Report status |
| PING | PONG | Test connection |

---

## Testing After Upload

### 1. Check Pico LED
```
Should blink 3 times on startup
Then stay ready for commands
```

### 2. Open Serial Monitor (ESP32)
```
Arduino IDE → Tools → Serial Monitor
Set to 115200 baud
```

### 3. Look for Messages
```
Should see:
"Pico ready for serial communication"
or similar message
```

### 4. Test Commands
```
When ESP32 boots, it will send:
"ESP_READY"

Pico should respond:
"PICO_READY"

And LED should blink
```

---

## If Compilation Fails

**Common errors:**

1. **"pico_sdk_import.cmake not found"**
   - The online IDE should have this built-in
   - Try a different online IDE

2. **"UART1 not found"**
   - Verify UART_ID and pin numbers
   - Check GPIO 8, 9 assignments

3. **"LED_PIN undefined"**
   - PICO_DEFAULT_LED_PIN should exist
   - May need to define manually as 25

---

## Alternative: Manual Compile (If Online IDE Fails)

If the online IDE doesn't work, try:
```
https://github.com/raspberrypi/pico-sdk
Download latest release
Follow official Pico setup guide
```

But **try the online IDE first** - much simpler!

---

## Ready to Upload?

1. **Go to: https://wokwi.com/pi/pico**
2. **Paste the code above**
3. **Click Compile/Run**
4. **Download the .uf2 file**
5. **Upload to Pico (BOOTSEL method)**
6. **LED should blink!**

**Let me know when you get the .uf2 file and I'll guide you through the upload!** 🚀
