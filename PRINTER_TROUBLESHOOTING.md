# Printer Communication Troubleshooting Guide

## Diagnostic Checklist

### 1. **Verify Hardware Connections**

**Check these connections with a multimeter:**

```
Pico GPIO 0 (pin 1) ↔ Printer D- pin
  - Should show continuity through 22Ω resistor
  - Voltage when idle: ~0V

Pico GPIO 1 (pin 2) ↔ Printer D+ pin
  - Should show continuity through 22Ω resistor
  - Voltage when idle: ~3.3V

Pico GND ↔ Printer GND
  - Should show 0Ω continuity

Pico 5V ↔ Printer USB VCC (optional, if printer powered externally)
  - Should show 5V when plugged in
```

**Common connection issues:**
- ❌ Resistors installed backwards (doesn't matter for 22Ω)
- ❌ Loose solder joints
- ❌ Wrong GPIO pins (verify pin numbers on Pico board)
- ❌ Printer USB cable has data lines intact

### 2. **Test UART Bridge (Minimal Test)**

**Use this firmware** to test if Pico↔Printer UART works:
- File: `firmware/pico_simple/pico_simple_uart_bridge.c`
- This creates a serial bridge: anything sent to Pico from ESP32 gets echoed to printer

**To use:**
1. Compile: `cmake ..` + `make -j4`
2. Flash to Pico
3. From ESP32 serial monitor, send: `ESC` (byte 0x1B)
4. Expected: Printer beeps or shows response (different for each printer model)

### 3. **Check Printer Baud Rate**

**EPSON L3115 specifications:**
- Default baud rate: **9600 baud**
- ⚠️ Current firmware uses: **115200 baud**

**If printer doesn't respond:**
1. Change `PRINTER_BAUD_RATE` from `115200` to `9600`
2. Recompile and test

### 4. **Verify ESC/POS Command Format**

**EPSON L3115 uses slightly different commands than generic ESC/POS:**

#### Current commands (might not work):
```c
ESC @ = 0x1B 0x40  // Initialize
ESC a = 0x1B 0x61  // Alignment
GS  ! = 0x1D 0x21  // Font size
ESC E = 0x1B 0x45  // Bold
GS  V = 0x1D 0x56  // Cut paper
```

#### Known working EPSON commands:
```c
// Reset/Initialize (works)
0x1B 0x40                // ESC @

// Alignment (check command)
0x1B 0x61 0x01          // Center align

// Text with line feeds
printf("Text\n\r");     // Use both \n and \r

// Cut paper (for TM-L series)
0x1D 0x56 0x41 0x00     // GS V A 0

// Power down (graceful shutdown)
0x1B 0x3D 0x01          // ESC = 1
```

### 5. **Serial Port Monitor Check**

**Open serial monitor on ESP32 at 115200 baud:**

Expected output when print command sent:
```
[API] Fetching: https://printosk.vercel.app/api/kiosk/print-job/837032
[API] HTTP Code: 200
[API] Response received: 463 bytes
START_PRINT:837032:1
[Pico] Sent: START_PRINT:837032:1
[Pico] DEBUG: Parsing command: START_PRINT:837032:1
[Pico] DEBUG: Command parsed successfully
[Pico] DEBUG: Job ID: 837032
[Pico] DEBUG: File count: 1
[Pico] DEBUG: Initializing printer...
[Pico] DEBUG: Sending alignment command...
...
[Pico] Print job completed
```

**If you see:** `[Pico] ERROR: Command parsing failed`
- The `START_PRINT` command format is wrong
- Check ESP32 firmware: `fetchPrintJob()` function

### 6. **Test with Simple Text**

Create minimal Pico test code:
```c
void test_printer() {
    uart_init(uart0, 115200);
    gpio_set_function(0, GPIO_FUNC_UART);
    gpio_set_function(1, GPIO_FUNC_UART);
    
    // Simple test: just send "Hello"
    uart_puts(uart0, "Hello Printer\n");
    
    // Wait for printer
    sleep_ms(1000);
}
```

**Expected:** Printer outputs "Hello Printer" (might need to adjust baud rate)

### 7. **Physical Printer Checks**

**On the printer itself:**
- ☑ Power is ON (lights on)
- ☑ Paper is loaded
- ☑ Paper cover is closed
- ☑ No paper jam indicator lights
- ☑ USB cable is properly seated (if USB powered)

**Try manual test:**
- Look for printer self-test button or menu
- Some EPSON printers have built-in self-test
- This verifies printer mechanics work

### 8. **Voltage Level Check**

**Use multimeter to check:**
```
Pico GPIO 0 (TX) voltage: 
  - Idle: 3.3V
  - Transmitting: 0-3.3V (toggles)

Pico GPIO 1 (RX) voltage:
  - Should match printer output (typically 0-5V for USB)

Pico to Printer ground:
  - Should be 0Ω (common ground)
```

**If voltages wrong:**
- Check resistor values (22Ω should be there)
- Verify GPIO pins not damaged
- Check capacitors near printer power

## Quick Diagnosis Flow

1. **Printer powers on when connected?**
   - NO → Check power supply (USB or 5V)
   - YES → Go to step 2

2. **Can you send simple text from Pico?**
   - NO → Check UART bridge firmware
   - YES → Go to step 3

3. **Does printer beep/respond to ESC/POS init?**
   - NO → Try baud rate 9600 instead of 115200
   - YES → Go to step 4

4. **Does printer handle text alignment commands?**
   - NO → Check EPSON command format for your model
   - YES → Go to step 5

5. **Does paper cut work?**
   - NO → GS V command might be different
   - YES → Full system works! ✅

## Files to Test

### Test 1: UART Bridge (fastest diagnosis)
```bash
cp firmware/pico_simple/pico_simple_uart_bridge.c firmware/pico_simple/pico_simple.c
cmake .. && make
# Flash to Pico
# From ESP32 terminal: send raw bytes to check if printer responds
```

### Test 2: Debug Version (with detailed logging)
```bash
# Use the updated pico_simple.c with DEBUG statements
cmake .. && make
# Flash and check serial output for all debug messages
```

### Test 3: Simplified Printer Init
Modify `handle_print_command()` to only:
1. Initialize printer
2. Send single "TEST\n"
3. Don't use bold/size/alignment commands
4. Check if printer outputs anything

## Expected Behavior by Baud Rate

**At 115200 baud:**
- Printer gibberish/no response → Correct baud for UART0
- Perfect text output → Great! System works
- Partial/corrupted text → Check cable shielding

**At 9600 baud:**
- Clear text output → This is correct baud rate for printer
- "TEST" appears correctly → Adjust firmware

## Next Action

1. Check physical connections with multimeter
2. Try UART bridge firmware first (simplest test)
3. If that works, check baud rate
4. If that works, debug ESC/POS commands
5. If still failing, check printer self-test

Report back with serial monitor output and I'll provide next steps!
