"""
Ultra-minimal Pico test - just UART
"""

import machine
import utime
from machine import UART, Pin

print("Starting...")

uart = UART(1, 115200)
led = Pin(25, Pin.OUT)

print("UART initialized")

led.on()
utime.sleep(1)
led.off()

count = 0
while True:
    count = count + 1
    
    if uart.any():
        data = uart.read(uart.any())
        print("Got: " + str(len(data)) + " bytes")
        uart.write(b"ACK\n")
    
    if count > 50:
        uart.write(b"PING\n")
        count = 0
        led.on()
        utime.sleep_ms(50)
        led.off()
    
    utime.sleep_ms(100)
