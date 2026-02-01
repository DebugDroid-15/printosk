"""
Pico MicroPython Controller - Printer Communication Handler
Handles UART communication with ESP32 and printer control
"""

import machine
import utime
from machine import UART, Pin

# UART Configuration
# UART1 (ESP32): TX=GPIO8 (Pin 11), RX=GPIO9 (Pin 12)
# UART0 (Printer): TX=GPIO0 (Pin 1), RX=GPIO1 (Pin 2)
uart = UART(1, baudrate=115200, tx=Pin(8), rx=Pin(9))

# LED for status indication (GPIO25 on Pico)
led = Pin(25, Pin.OUT)

# Pico state variables
pico_ready = True
print_status = "IDLE"
current_print_job = None
last_heartbeat_from_esp32 = utime.time()  # Initialize to current time
pico_heartbeat_counter = 0
message_count = 0  # Track messages received

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
    global print_status, current_print_job, last_heartbeat_from_esp32, pico_ready, message_count
    
    message_count += 1
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
    global rx_index, message_count
    
    # Check if data is available
    bytes_available = uart.any()
    
    if bytes_available:
        # Read up to 64 bytes at a time
        data = uart.read(min(64, bytes_available))
        if data:
            for byte in data:
                rx_buffer[rx_index] = byte
                rx_index += 1
                
                # Check for newline or buffer full
                if byte == ord('\n') or rx_index >= len(rx_buffer) - 1:
                    # Process complete message
                    message = bytes(rx_buffer[:rx_index]).strip()
                    if message:
                        process_esp32_message(message)
                    rx_index = 0
        
        return True  # Return True if we received data
    
    return False  # No data available

def main():
    """Main loop"""
    global pico_heartbeat_counter, last_heartbeat_from_esp32, message_count
    
    print("\n" + "="*50)
    print("PICO MICROPYTHON CONTROLLER STARTED")
    print("="*50)
    print("UART1: TX=GPIO8 (Pin 11), RX=GPIO9 (Pin 12)")
    print("Connected to ESP32 at 115200 baud")
    print("Waiting for ESP32 heartbeat...\n")
    
    blink_led(3, 100)  # Startup indicator
    
    # Main loop
    loop_counter = 0
    diagnostic_counter = 0
    
    try:
        while True:
            # Read any incoming messages
            has_data = read_uart_messages()
            
            # Increment heartbeat counter every 5 seconds
            loop_counter += 1
            if loop_counter >= 50:  # 50 * 100ms = 5 seconds
                pico_heartbeat_counter += 1
                loop_counter = 0
                
                # Check if we received heartbeat recently (within 15 seconds)
                time_since_heartbeat = utime.time() - last_heartbeat_from_esp32
                if time_since_heartbeat > 15:
                    print(f"[WARNING] No heartbeat for {time_since_heartbeat}s (Messages: {message_count})")
                    blink_led(1, 50)
            
            # Show diagnostic every 30 seconds
            diagnostic_counter += 1
            if diagnostic_counter >= 300:  # 300 * 100ms = 30 seconds
                diagnostic_counter = 0
                bytes_available = uart.any()
                if message_count == 0:
                    print(f"[DIAGNOSTIC] No messages received in {diagnostic_counter//10}s")
                    print(f"  - UART buffer: {bytes_available} bytes available")
                    print(f"  - Try: Check GPIO 8/9 connections between ESP32 and Pico")
                else:
                    print(f"[DIAGNOSTIC] Received {message_count} messages so far")
                    print(f"  - UART buffer: {bytes_available} bytes available")
            
            # Sleep 100ms between iterations
            utime.sleep_ms(100)
            
    except KeyboardInterrupt:
        print("\n[PICO] Shutting down...")
        blink_led(5, 100)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        blink_led(10, 50)

if __name__ == "__main__":
    main()
