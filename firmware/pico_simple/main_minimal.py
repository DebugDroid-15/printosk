"""
Minimal Pico MicroPython - Just test UART communication
"""

import machine
import utime
from machine import UART, Pin

# UART Configuration
uart = UART(1, 115200)

# LED
led = Pin(25, Pin.OUT)

# Simple state
message_count = 0
pico_heartbeat_counter = 0
rx_buffer = bytearray(512)
rx_index = 0

def blink_led(times, duration):
    for _ in range(times):
        led.on()
        utime.sleep_ms(duration)
        led.off()
        utime.sleep_ms(duration)

def send_message(msg):
    uart.write(msg)
    uart.write(b'\n')
    uart.flush()

print("PICO STARTED")
blink_led(3, 100)

loop_counter = 0
diagnostic_counter = 0

while True:
    # Read UART
    if uart.any():
        data = uart.read(uart.any())
        if data:
            message_count = message_count + 1
            print("[RX] " + str(len(data)) + " bytes")
            
            # Echo back
            send_message(b"PICO_READY")
            blink_led(1, 50)
    
    # Send heartbeat every 5 seconds
    loop_counter = loop_counter + 1
    if loop_counter >= 50:
        loop_counter = 0
        pico_heartbeat_counter = pico_heartbeat_counter + 1
        print("[HEARTBEAT] " + str(pico_heartbeat_counter))
    
    # Diagnostic every 30 seconds
    diagnostic_counter = diagnostic_counter + 1
    if diagnostic_counter >= 300:
        diagnostic_counter = 0
        print("[STAT] Messages: " + str(message_count))
    
    utime.sleep_ms(100)
