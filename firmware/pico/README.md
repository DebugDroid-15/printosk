# Printosk Raspberry Pi Pico Firmware

Bare-metal C firmware for the printer controller.

## Architecture

```
Pico Firmware (Single-threaded, Blocking)
├── UART Handler          → Receive commands from ESP32
├── Command Parser        → Parse JSON commands
├── Printer Interface     → USB printer communication
└── Status Reporter       → Send responses back
```

## Directory Structure

```
pico/
├── src/
│   ├── main.c              # Entry point
│   ├── config.h            # Configuration & pinouts
│   ├── uart.h/.c           # UART communication layer
│   ├── command_parser.h/.c # JSON command parsing
│   ├── printer.h/.c        # Printer interface abstraction
│   ├── usb_printer.h/.c    # USB driver
│   └── utils.h/.c          # Logging, memory utilities
│
├── CMakeLists.txt          # Build configuration
└── README.md               # This file
```

## Hardware Requirements

- **Microcontroller**: Raspberry Pi Pico
  - RP2040 (2 cores, 264 KB SRAM)
  - 2 MB flash
  - USB 2.0 OTG (host mode)
  
- **Interfaces**:
  - UART0 (GPIO0=TX, GPIO1=RX) → ESP32
  - USB Host (GPIO20-21) → Printer

## Design Philosophy

**Deterministic & Synchronous**: Unlike ESP32 (async, multi-threaded), Pico uses simple blocking execution:
- Receive command → Execute → Send response
- No callbacks, no task switching
- Easier to debug and verify

**No Dynamic Memory**: All buffers pre-allocated on boot.

**Minimal Dependencies**: Just Pico SDK, no extra libraries.

## Building & Flashing

### Prerequisites

Install ARM GCC and CMake:

**Windows**:
```bash
# Install ARM GCC from: https://developer.arm.com/downloads/-/gnu-rm
# Install CMake from: https://cmake.org/download/

# Set PICO_SDK_PATH
setx PICO_SDK_PATH C:\pico\pico-sdk
```

**Linux/Mac**:
```bash
brew install arm-none-eabi-gcc cmake
export PICO_SDK_PATH=~/pico-sdk
```

### Build

```bash
cd firmware/pico
mkdir build
cd build
cmake ..
make -j4
```

Produces: `printosk_pico.uf2`

### Flash

1. Hold **BOOTSEL** button on Pico
2. Connect USB to computer (holding BOOTSEL)
3. Release BOOTSEL
4. Copy `printosk_pico.uf2` to RPI-RP2 drive
5. Pico reboots and runs firmware

### Monitor Serial

```bash
# Linux/Mac
picocom -b 115200 /dev/ttyUSB0

# Windows
picocom -b 115200 COM3

# Ctrl+A, Ctrl+X to exit
```

## Execution Flow

```
main()
  ↓
init_hardware()
  ├── uart_init(115200, 8N1)
  ├── printer_init()
  └── Send "READY" to ESP32
  ↓
Main Loop (forever)
  ├── Check UART for data
  ├── If data available:
  │   ├── Read frame
  │   ├── Parse JSON command
  │   ├── Validate
  │   ├── Execute print job
  │   ├── Send status updates
  │   └── Return to idle
  └── sleep_ms(100)
```

## UART Frame Format

```
[0xAA][LEN_L][LEN_H][TYPE][PAYLOAD][CRC][0xBB]
```

Example PING from ESP32:
```
0xAA 0x00 0x00 0x01 0xFE 0xBB
     ─ LENGTH=0
              ─ TYPE=PING (0x01)
                    ─ CRC of [0x01]
```

## Command Execution

### PING (0x01)

Request (ESP32 → Pico):
```json
{"type": 1}
```

Response (Pico → ESP32):
```json
{"type": 1, "status": 0}
```

### PRINT_COMMAND (0x10)

Request (ESP32 → Pico):
```json
{
  "type": 16,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "total_pages": 5,
  "color": false,
  "copies": 2,
  "file_url": "https://supabase.co/storage/...",
  "mock_mode": false
}
```

Execution steps:
1. Parse JSON
2. Validate fields
3. Download file (if mock_mode=false, simulate)
4. Connect to printer (USB scan)
5. Send print command
6. Wait for completion
7. Send status updates (STARTED, PRINTING, DONE)

Response (Pico → ESP32, multiple):
```json
{"type": 32, "status": 1, "job_id": "...", "message": "Print started"}
{"type": 32, "status": 2, "progress": 50, "job_id": "...", "message": "Page 1/5"}
{"type": 32, "status": 3, "progress": 100, "job_id": "...", "message": "Complete"}
```

## Printer Interface

### Abstract Layer

The `printer.h` interface is hardware-agnostic:

```c
typedef struct {
  uint16_t vendor_id;
  uint16_t product_id;
  int device_handle;
  bool connected;
} PrinterController;

bool printer_init(PrinterController* p);
bool printer_connect(PrinterController* p);
bool printer_print(PrinterController* p, const PrintJob* job);
void printer_disconnect(PrinterController* p);
```

### Supported Protocols

- **Epson ESC/P**: Command-based, simple
- **HP PCL**: Page description language
- **PostScript**: Advanced (via CUPS on Pi)

### USB Implementation

```c
// Discover printer on USB bus
usb_printer_find(&vid, &pid);

// Open device
usb_printer_open(vid, pid, &handle);

// Send commands
usb_printer_write(handle, data, len, timeout_ms);

// Read response
usb_printer_read(handle, buffer, len, timeout_ms);

// Close
usb_printer_close(handle);
```

## Status Codes

| Code | Name | Description |
|------|------|-------------|
| 0x00 | READY | Idle, no job |
| 0x01 | STARTED | Job initialized |
| 0x02 | PRINTING | Active printing |
| 0x03 | DONE | Completed successfully |
| 0x04 | ERROR | Job failed |
| 0x05 | CANCELLED | Cancelled by user |

## Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 1001 | Printer offline | USB device not detected |
| 1002 | Print timeout | Exceeded 5-minute limit |
| 1003 | Paper jam | Printer reported jam |
| 1004 | Out of paper | Printer out of paper |
| 1005 | Parse error | Invalid JSON |
| 1006 | Download failed | File fetch error |
| 2001 | UART frame error | Invalid frame delimiters |
| 2002 | CRC failed | Checksum mismatch |

## Memory Layout

```
Pico SRAM (264 KB)
┌─────────────────────────────────────┐
│ .data + .bss segments (runtime)     │ ~50 KB
├─────────────────────────────────────┤
│ Print buffer (64 KB)                │
├─────────────────────────────────────┤
│ UART command buffer (512 B)         │
├─────────────────────────────────────┤
│ Stack (grows upward)                │ ~100 KB
└─────────────────────────────────────┘
```

## Serial Output Examples

### Successful Print

```
[INFO] Printosk Raspberry Pi Pico Firmware v1.0
[INFO] Initializing Pico hardware...
[INFO] UART initialized: 115200 baud
[INFO] Printer initialized
[INFO] Pico initialization complete

Waiting for print commands...

[INFO] Received 500 bytes from ESP32
[DEBUG] Payload: {"type":16,"job_id":"123...","pages":5,...}
[INFO] ======================================
[INFO] Starting print job: 123...
[INFO] Pages: 5, Color: No, Copies: 2
[INFO] ======================================
[INFO] [STEP 1/3] Downloading file...
[INFO] [STEP 2/3] Connecting to printer...
[INFO] USB: Found printer (VID=04B8, PID=0005)
[INFO] Printer connected
[INFO] [STEP 3/3] Sending print command...
[INFO] Printer ready, starting print...
[INFO] Page 1/5: Processing...
[INFO] Page 2/5: Processing...
[INFO] Page 3/5: Processing...
[INFO] Page 4/5: Processing...
[INFO] Page 5/5: Processing...
[INFO] Print completed successfully

[INFO] ======================================
[INFO] Job complete
[INFO] ======================================

Waiting for print commands...
```

### Error Handling

```
[INFO] Received 450 bytes from ESP32
[ERROR] Parse error: Missing field 'total_pages'
[INFO] Sending error response...
```

```
[INFO] Received 500 bytes from ESP32
[INFO] Connecting to printer...
[ERROR] USB: Printer not found!
[INFO] Sending error response: Printer offline
```

## Testing

### Mock Mode

Enable in `config.h`:
```cpp
#define FEATURE_MOCK_PRINTER 1
```

This simulates printer responses without actual USB device.

### Manual Testing

```bash
# Monitor Pico
picocom -b 115200 /dev/ttyUSB0 &

# Send test command (Python)
python3 <<EOF
import serial
import json

port = serial.Serial('/dev/ttyUSB0', 115200)

# Build PING frame: [0xAA][0x00][0x00][0x01][CRC][0xBB]
frame = b'\xAA\x00\x00\x01\xFE\xBB'
port.write(frame)

# Read response
response = port.read(6)
print("Response:", response.hex())
port.close()
EOF
```

## Performance

| Metric | Value | Notes |
|--------|-------|-------|
| Boot time | 1s | Quick startup |
| Command parsing | 10ms | JSON parse |
| USB discovery | 500ms | Scan USB bus |
| Print per page | 100-500ms | Depends on printer |
| Status update latency | <50ms | UART only |
| Memory usage | ~120 KB | ~45% of SRAM |

## Debugging Tips

### Enable Debug Logs

In `config.h`:
```cpp
#define ENABLE_DEBUG_LOGS 1
```

### UART Monitoring

Monitor both directions:
```bash
# Terminal 1: Monitor Pico
picocom -b 115200 /dev/ttyUSB0

# Terminal 2: Monitor ESP32
picocom -b 115200 /dev/ttyUSB1
```

### Add Debug Breakpoints (with external debugger)

```c
// Set breakpoint in main.c
execute_print_job(cmd);  // ← Breakpoint here
```

Use Pico Debug Probe or OpenOCD.

## Future Enhancements

- [ ] USB hub support (multiple printers)
- [ ] Printer auto-detection (scan all printers)
- [ ] Duplex printing support
- [ ] Color space conversion (RGB → CMYK)
- [ ] Print job queue (multiple jobs)
- [ ] Encrypted UART (optional)
- [ ] Printer status monitoring
- [ ] Spool to flash (offline queue)

## License

Proprietary - Printosk

## Support

For issues, refer to:
- UART protocol spec
- API specification
- Hardware wiring diagram

