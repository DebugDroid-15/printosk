"""
Pico MicroPython Controller - Printer Communication Handler
Handles UART communication with ESP32 and printer control
"""

import machine
import utime
from machine import UART, Pin

# UART Configuration
# TX: GPIO0 (Pin 1), RX: GPIO1 (Pin 2)
uart = UART(0, baudrate=115200, tx=Pin(0), rx=Pin(1))

# LED for status indication (GPIO25 on Pico)
led = Pin(25, Pin.OUT)

# Pico state variables
pico_ready = True
print_status = "IDLE"
current_print_job = None
last_heartbeat_from_esp32 = 0
pico_heartbeat_counter = 0

# Response buffer
rx_buffer = bytearray(512)
rx_index = 0

def blink_led(times=1, duration=100):
    """Blink LED for status indication"""
    for _ in range(times):
        led.on()
        utime.sleep_ms(duration)
        led.off()
        utime.sleep_ms(duration)

def send_message(message):
    """Send message to ESP32 via UART"""
    if isinstance(message, str):
        message = message.encode() + b'\n'
    uart.write(message)
    print(f"[PICO] Sent: {message}")

def process_esp32_message(message):
    """Process incoming message from ESP32"""
    global print_status, current_print_job, last_heartbeat_from_esp32, pico_ready
    
    message_str = message.decode('utf-8', errors='ignore').strip()
    print(f"[PICO] Received: {message_str}")
    
    if not message_str:
        return
    
    # Parse message format: COMMAND:DATA
    if ':' in message_str:
        command, data = message_str.split(':', 1)
        command = command.strip().upper()
        data = data.strip()
    else:
        command = message_str.upper()
        data = ""
    
    # Handle ESP32 heartbeat
    if command == "ESP32_HEARTBEAT":
        last_heartbeat_from_esp32 = utime.time()
        blink_led(1, 50)  # Single fast blink
        # Send Pico heartbeat response
        response = f"PICO_HEARTBEAT:{pico_heartbeat_counter}:READY"
        send_message(response)
        return
    
    # Handle print job requests
    if command == "PRINT_JOB":
        current_print_job = data
        print_status = "PRINTING"
        pico_ready = False
        blink_led(2, 100)  # Double blink
        response = f"JOB_RECEIVED:{data}"
        send_message(response)
        # Simulate print job (5 seconds)
        utime.sleep(5)
        print_status = "IDLE"
        pico_ready = True
        response = f"JOB_COMPLETE:{data}"
        send_message(response)
        return
    
    # Handle status requests
    if command == "GET_STATUS":
        response = f"STATUS:{print_status}:READY:{pico_ready}"
        send_message(response)
        return
    
    # Handle echo test
    if command == "ECHO":
        response = f"ECHO_RESPONSE:{data}"
        send_message(response)
        return
    
    # Unknown command
    response = f"ERROR:UNKNOWN_COMMAND:{command}"
    send_message(response)

def read_uart_messages():
    """Read all available messages from UART buffer"""
    global rx_index
    
    while uart.any():
        byte = uart.read(1)
        if byte:
            rx_buffer[rx_index] = byte[0]
            rx_index += 1
            
            # Check for newline or buffer full
            if byte[0] == ord('\n') or rx_index >= len(rx_buffer) - 1:
                # Process complete message
                message = bytes(rx_buffer[:rx_index]).strip()
                if message:
                    process_esp32_message(message)
                rx_index = 0

def main():
    """Main loop"""
    global pico_heartbeat_counter
    
    print("\n" + "="*50)
    print("PICO MICROPYTHON CONTROLLER STARTED")
    print("="*50)
    print("UART0: TX=GPIO0 (Pin 1), RX=GPIO1 (Pin 2)")
    print("Baudrate: 115200")
    print("Waiting for ESP32 heartbeat...\n")
    
    blink_led(3, 100)  # Startup indicator
    
    # Main loop
    loop_counter = 0
    
    try:
        while True:
            # Read any incoming messages
            read_uart_messages()
            
            # Increment heartbeat counter every 5 seconds
            loop_counter += 1
            if loop_counter >= 50:  # 50 * 100ms = 5 seconds
                pico_heartbeat_counter += 1
                loop_counter = 0
                
                # Check if we received heartbeat from ESP32 recently
                time_since_heartbeat = utime.time() - last_heartbeat_from_esp32
                if time_since_heartbeat > 15:
                    print(f"[WARNING] No ESP32 heartbeat for {time_since_heartbeat}s")
                    blink_led(1, 50)
            
            # Sleep 100ms between iterations
            utime.sleep_ms(100)
            
    except KeyboardInterrupt:
        print("\n[PICO] Shutting down...")
        blink_led(5, 100)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        blink_led(10, 50)

if __name__ == "__main__":
    main()
