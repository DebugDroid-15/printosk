# Pico Printer Integration - EPSON L3115 Support

## Overview
The Pico firmware has been updated to support direct USB communication with the EPSON L3115 thermal printer using ESC/POS commands.

## Hardware Configuration

### Pin Assignments
- **ESP32 ↔ Pico Communication**: Hardware UART1 on GPIO 8 (TX) & GPIO 9 (RX)
- **Pico ↔ Printer Communication**: Hardware UART0 on GPIO 0 (TX) & GPIO 1 (RX)
- **Both UARTs**: 115200 baud rate

### Physical Connections
```
Pico GPIO 0 (TX) → Printer D- (via 22Ω resistor)
Pico GPIO 1 (RX) → Printer D+ (via 22Ω resistor)
Pico GND → Printer GND (common ground)
Pico 5V → Printer USB VCC (via capacitor for stability)
```

## Firmware Features

### Command Protocol
The Pico listens for commands from ESP32 on UART1:

1. **Connection Handshake**:
   - ESP32 sends: `ESP_READY`
   - Pico responds: `PICO_READY`

2. **Print Job Execution**:
   - ESP32 sends: `START_PRINT:jobid:filecount`
   - Pico initializes printer
   - Pico sends ESC/POS commands
   - Pico notifies ESP32: `[Pico] Print job completed`

### ESC/POS Commands Implemented
- `ESC @` - Initialize printer (clear buffers)
- `ESC a` - Set alignment (0=left, 1=center, 2=right)
- `GS !` - Set text size (0=normal, 0x11=double width)
- `ESC E` - Bold on/off
- `GS V` - Cut paper
- Standard line feed `\n`

### Print Output Format
```
         PRINTOSK              (centered, bold, double width)

Job ID: [JOBID]
Files: [COUNT]
Status: PRINTING

   Thank you for printing!   (centered)

[Paper cut]
```

## Compilation Instructions

### GitHub Codespaces Method (RECOMMENDED)

1. **Open in Codespaces**:
   - Go to: https://github.com/DebugDroid-15/printosk
   - Click "Code" → "Codespaces" → "Create codespace on main"
   - Wait for container to initialize

2. **Navigate to Pico directory**:
   ```bash
   cd firmware/pico_simple
   mkdir -p build
   cd build
   ```

3. **Build with CMake**:
   ```bash
   cmake ..
   make -j4
   ```

4. **Output UF2 file**:
   - The compiled file will be at: `build/pico_simple.uf2`
   - This is ready to flash to Pico

### Alternative: Wokwi Simulation
- The code is compatible with Wokwi's Pico emulator
- Project file would need ESP32 serial mock

## Flashing to Pico

1. **Connect Pico in Bootloader Mode**:
   - Hold BOOTSEL button while plugging in USB

2. **Copy UF2 File**:
   - Drag `pico_simple.uf2` to the RPI-RP2 drive
   - Pico auto-reboots with new firmware

3. **Verify**:
   - Serial monitor should show:
     ```
     PICO_INITIALIZED
     WAITING_FOR_ESP32
     ```

## Testing Procedure

### Step 1: Verify UART Communication
- Use serial monitor on both ESP32 and Pico
- Should see handshake:
  ```
  ESP32: ESP_READY
  Pico: PICO_READY
  ```

### Step 2: Test Print Job
1. Enter Print ID `837032` on ESP32 kiosk
2. Press ENTER
3. Monitor serial output:
   ```
   [API] Fetching: https://printosk.vercel.app/api/kiosk/print-job/837032
   [API] HTTP Code: 200
   START_PRINT:837032:1
   [Pico] Sent: START_PRINT:837032:1
   [Pico] Processing: START_PRINT:837032:1
   [Pico] Print job completed
   ```

### Step 3: Check Physical Output
- Printer should:
  1. Initialize (power lights on)
  2. Print receipt with job info
  3. Cut paper automatically

## Troubleshooting

### Printer Not Responding
- **Check**: Are GPIO 0/1 properly connected to printer?
- **Check**: Is printer power enabled (5V to VCC)?
- **Fix**: Add capacitor (100µF) near printer 5V input for stability

### Command Timeout
- **Check**: Is printer UART responding at 115200 baud?
- **Check**: Are 22Ω resistors properly installed?
- **Fix**: Some printers need 9600 baud - modify `PRINTER_BAUD_RATE`

### LED Not Blinking
- **Check**: Is Pico flashed correctly?
- **Fix**: Try re-flashing with BOOTSEL held during power-on

### Print Output Missing Text
- **Check**: Are ESC/POS sequences correct for EPSON L3115?
- **Reference**: EPSON ESC/POS Programming Manual for your model

## Next Steps

1. **Compile and flash** the Pico firmware using GitHub Codespaces
2. **Test** the print job with Print ID 837032
3. **Verify** paper output has correct formatting
4. **Debug** any printer-specific issues using serial monitor
5. **Document** any necessary baud rate or ESC/POS adjustments

## Files Modified
- `firmware/pico_simple/pico_simple.c` - Added UART0 printer communication, ESC/POS command handler

## References
- [EPSON TM-L3115 Technical Manual](https://reference.epson-biz.com/)
- [Pico UART Documentation](https://datasheets.raspberrypi.com/pico/raspberry-pi-pico-c-sdk.pdf)
- [ESC/POS Command Reference](https://en.wikipedia.org/wiki/ESC/P)
