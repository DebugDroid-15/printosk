# Printosk ESP32 Firmware

Arduino-compatible firmware for the ESP32 kiosk controller.

## Architecture

```
ESP32 Firmware (Multi-threaded FreeRTOS)
├── Main Task (main.cpp)
│   ├── WiFi Manager        → Handles WiFi connectivity
│   ├── Supabase Client     → REST API calls to database
│   ├── Keypad Manager      → 4x4 numeric matrix input
│   ├── Display Manager     → SSD1306 OLED output
│   ├── UART Protocol       → Serial comm with Pico
│   └── State Machine       → Job lifecycle FSM
│
└── FreeRTOS Tasks
    ├── keypad_task         (Priority 1) → Read key input every 50ms
    ├── display_task        (Priority 1) → Update OLED every 500ms
    ├── network_task        (Priority 1) → Monitor WiFi every 5s
    └── uart_task           (Priority 2) → Handle Pico responses
```

## Directory Structure

```
esp32/
├── src/
│   ├── main.cpp                # Entry point, task creation
│   ├── config.h                # Configuration & pinouts
│   ├── wifi_manager.h/.cpp     # WiFi handling
│   ├── supabase_client.h/.cpp  # REST API client
│   ├── keypad.h/.cpp           # Keypad input driver
│   ├── display.h/.cpp          # OLED display driver
│   ├── uart_protocol.h/.cpp    # UART frame codec
│   ├── state_machine.h/.cpp    # FSM implementation
│   └── utils.h/.cpp            # Logging, memory utilities
│
├── platformio.ini              # Build configuration
└── README.md                   # This file
```

## Hardware Requirements

- **Microcontroller**: ESP32 DevKit v1
  - 4 MB flash
  - 520 KB RAM (usable heap)
  - Built-in WiFi, dual-core
  
- **Peripherals**:
  - 4x4 Numeric Keypad (16 keys)
  - SSD1306 OLED 128x64 (I2C)
  - UART to Raspberry Pi Pico (115200 baud)

## Building & Flashing

### Prerequisites

Install PlatformIO (VSCode extension or CLI):
```bash
pip install platformio
```

### Configuration

Edit `src/config.h`:
```cpp
#define WIFI_SSID "Your_SSID"
#define WIFI_PASSWORD "Your_Password"
#define SUPABASE_URL "https://project.supabase.co"
#define SUPABASE_API_KEY "your_api_key"
```

### Build

```bash
# Build
platformio run

# Upload to ESP32
platformio run --target upload

# Monitor serial output
platformio device monitor --baud 115200
```

## State Machine

```
┌─────────────────────────────────────────────────────────┐
│                    FSM State Diagram                      │
└─────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────┐
    │ IDLE: Waiting for user to enter Print ID    │
    │ - Display: "Enter Print ID"                 │
    │ - Accepts: 0-9, ENTER, BACKSPACE            │
    └────────────────┬───────────────────────────┬┘
                     │ User enters 6 digits      │ TIMEOUT (30s)
                     │ presses ENTER             │ → Reset
                     ↓                           ↓
    ┌──────────────────────────────┐    ┌──────────────────────┐
    │ FETCHING: Querying Supabase  │    │ ERROR: Display error │
    │ - Display: "Fetching job..." │    │ - Wait 30s          │
    │ - HTTP GET to /print_jobs    │    │ - Reset to IDLE      │
    │ - Timeout: 10s               │    └──────────────────────┘
    └────────────┬────────────┬─────┘
                 │ Job found  │ Job not found
                 ↓            ↓ or invalid
    ┌──────────────────────────────┐    ┌──────────────────────┐
    │ VALIDATING: Show job details │    │ ERROR: "Invalid ID"  │
    │ - Display: Job title, copies │    │ - Retry entry        │
    │ - Wait 3s for confirmation   │    └──────────────────────┘
    │ - User can press BACK to cancel
    └────────────┬────────────┬─────┘
                 │ ENTER      │ BACK/TIMEOUT
                 ↓            ↓
    ┌──────────────────────────────┐    Back to IDLE
    │ PRINTING: Job in progress    │
    │ - Display: "Printing..."     │
    │ - Send PRINT_CMD to Pico     │
    │ - Wait for STATUS responses  │
    │ - Timeout: 5 min             │
    └────────────┬────────────┬─────┘
                 │ Done       │ Error
                 ↓            ↓
    ┌──────────────────────────────┐    ┌──────────────────────┐
    │ DONE: Print completed        │    │ ERROR: Show message  │
    │ - Display: "Print complete!" │    │ - Wait 30s           │
    │ - Update status in Supabase  │    │ - Reset to IDLE      │
    │ - Mark job for deletion      │    └──────────────────────┘
    │ - Wait 5s, return to IDLE    │
    └────────────┬─────────────────┘
                 │
                 ↓
    Back to IDLE (loop)
```

## Key Input Handling

Keypad matrix:
```
     Col0  Col1  Col2  Col3
Row0:  1     2     3   ENTER
Row1:  4     5     6   BACKSPACE
Row2:  7     8     9   UP
Row3:  *     0     #   DOWN
```

Print ID Entry:
- 6 digits (100000-999999)
- Can backspace to correct
- 30-second timeout if idle
- Up/Down for previous/next attempts (future)

## Display Output

### OLED Layout (128x64 pixels)

```
┌──────────────────────────────────┐
│ Print ID [WiFi] [Bat]            │ Header (10px)
├──────────────────────────────────┤
│                                  │
│ Enter Print ID:                  │ Main content (40px)
│ [1][2][3][?]                     │
│                                  │
│ ENTER=Confirm  BACK=Clear        │ Footer (10px)
└──────────────────────────────────┘
```

### Status States

```
IDLE:
  "Enter Print ID"
  "1234"

FETCHING:
  "Fetching job..."
  (spinner animation)

VALIDATING:
  "Resume"
  "2 copies, B&W"

PRINTING:
  "Printing page 1 of 5"
  "████████░░ 80%"

DONE:
  "Print complete!"
  "Returning to main..."

ERROR:
  "Error: Printer offline"
  "(Retrying in 5s...)"
```

## UART Communication

Frame format: `[0xAA][LEN_L][LEN_H][TYPE][PAYLOAD][CRC][0xBB]`

### Example: Successful Print

```
ESP32 → Pico:
  Type: PRINT_CMD (0x10)
  Payload: {"job_id":"123...","pages":2,"color":false,"copies":1,...}

Pico → ESP32 (immediate):
  Type: STATUS (0x20)
  Status: STARTED
  Progress: 0

Pico → ESP32 (during print):
  Type: STATUS (0x20)
  Status: PRINTING
  Progress: 50
  Message: "Printing page 1 of 2"

Pico → ESP32 (completion):
  Type: STATUS (0x20)
  Status: DONE
  Progress: 100
  Message: "Print completed successfully"
```

## Power Management

- **Deep Sleep**: Not used (kiosk is always-on)
- **Clock Scaling**: Set to 240 MHz for speed
- **WiFi**: Low power mode when idle (optional)
- **Display**: Backlight always on

**Power Consumption**:
- Active: ~150mA at 5V
- WiFi connecting: ~200mA
- UART idle: ~50mA

## Memory Management

- **Heap**: ~250 KB available
- **UART Buffer**: 512 bytes
- **Keypad Buffer**: 10 bytes (key input)
- **Status Buffer**: 256 bytes
- **No malloc after init**: Pre-allocated buffers

**Heap Monitoring**:
```cpp
log_debug("[HEAP] Free: %u bytes, Max block: %u bytes",
  ESP.getFreeHeap(),
  ESP.getMaxAllocHeap());
```

## Debugging

### Serial Monitor

```bash
platformio device monitor --baud 115200
```

Output example:
```
[INFO] Printosk ESP32 Firmware v1.0
[INFO] Device ID: AA:BB:CC:DD:EE:FF
[INFO] Initializing display...
[INFO] Initializing keypad...
[INFO] Connecting to WiFi...
[INFO] WiFi connected! IP: 192.168.1.100
[DEBUG] Free heap: 245632 bytes
[KEYPAD] Pressed: 1
[KEYPAD] Pressed: 2
[KEYPAD] Pressed: 3
[KEYPAD] Pressed: 4
[KEYPAD] Pressed: 5
[KEYPAD] Pressed: 6
[KEYPAD] Pressed: E
[INFO] Validating Print ID: 123456
[INFO] Fetching job from Supabase...
[HTTP] GET /rest/v1/print_jobs?print_id_numeric=eq.123456
[HTTP] Response: 200 OK
[INFO] Job found: Resume (2 copies, B&W)
[UART] Sending PRINT_COMMAND to Pico...
[UART] Received 42 bytes: type=STATUS, status=STARTED
[UART] Received 45 bytes: type=STATUS, status=PRINTING, progress=50
[UART] Received 43 bytes: type=STATUS, status=DONE, progress=100
[INFO] Print completed successfully!
[HTTP] POST /rest/v1/rpc/update_job_status
[HTTP] Response: 200 OK
[INFO] Waiting for next Print ID...
```

### Debug Mode

Enable in `config.h`:
```cpp
#define LOG_LEVEL_DEBUG 1
#define FEATURE_MOCK_KEYPAD 1        // Simulate key presses
#define FEATURE_MOCK_SUPABASE 1      // Mock API responses
#define FEATURE_DEBUG_DISPLAY 1      // Show debug info on OLED
```

## Testing

### Unit Tests (Manual)

1. **WiFi**:
   - Power on, check connection logs
   - Disable WiFi, verify reconnection attempt

2. **Keypad**:
   - Press each key, verify serial output
   - Test debouncing (rapid key press)

3. **Display**:
   - Verify text appears on OLED
   - Test different states (IDLE, PRINTING, ERROR)

4. **API**:
   - With valid Print ID: should fetch job
   - With invalid Print ID: should show error
   - With no WiFi: should timeout gracefully

5. **UART**:
   - Connect Pico, verify PING/PONG
   - Send PRINT_COMMAND, check Pico response

### Integration Test

1. Upload file on frontend
2. Pay via Razorpay
3. Get Print ID from frontend
4. Enter Print ID on ESP32
5. Verify job fetches
6. Verify print command sends to Pico
7. Verify status updates display
8. Verify job completed in Supabase

## Common Issues

### ESP32 Won't Flash
- Check USB cable
- Verify COM port (Device Manager)
- Hold BOOT button while flashing
- Try different USB port

### WiFi Won't Connect
- Verify SSID/password in config.h
- Check if WiFi is 2.4 GHz (5 GHz not supported)
- Check signal strength
- Restart ESP32 and router

### OLED Not Displaying
- Verify I2C pins (SDA=GPIO21, SCL=GPIO22)
- Check I2C address (0x3C default)
- Verify power (VCC=5V)
- Check for solder bridges

### Keypad Not Working
- Verify row pins (GPIO14-17)
- Verify col pins (GPIO18-21)
- Check matrix layout matches keypad physical layout
- Test with serial debug output

### UART No Communication
- Verify baud rate (115200)
- Check TX/RX pins reversed
- Verify GND connected
- Monitor both serial ports simultaneously

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Startup time | 5s | WiFi + initialization |
| Keypad response | 50ms | Debounce delay |
| Print ID fetch | 2-3s | Network + JSON parse |
| Status update | 500ms | Display refresh rate |
| UART latency | <100ms | Frame processing |
| Memory usage | ~150 KB | ~60% of available |

## Future Enhancements

- [ ] OTA firmware updates
- [ ] QR code scanning (instead of manual entry)
- [ ] Touch screen interface
- [ ] Multi-language support
- [ ] Job history (recent 5 prints)
- [ ] Admin mode (config via buttons)
- [ ] Printer status monitoring
- [ ] Payment display (show balance)
- [ ] Backup to EEPROM (offline job queue)

## License

Proprietary - Printosk

## Support

For issues or questions, refer to:
- Architecture docs
- API specification
- UART protocol spec
- Security guide

