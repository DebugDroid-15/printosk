# Printosk - Hardware Setup & Integration Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER KIOSK                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   OLED       │  │   KEYPAD     │  │   ESP32      │      │
│  │ 1.3" I2C     │  │  11 Buttons  │  │   DevKit     │      │
│  │ SSD1306      │  │  (0-9,Enter) │  │   V1         │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └────────────────┬────────────────────┘              │
│                          │                                   │
│                    ┌─────▼────────┐                          │
│                    │  Serial2     │                          │
│                    │  115200 baud │                          │
│                    └─────┬────────┘                          │
│                          │                                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │ USB Connection (Pins    │
              │ TX:17, RX:16)           │
              │ Pico UART1              │
              └────────────┬────────────┘
                           │
          ┌────────────────▼────────────────┐
          │    Raspberry Pi Pico            │
          │  (USB Serial Controller)        │
          └────────────────┬────────────────┘
                           │
                  ┌────────▼─────────┐
                  │  USB (Type B)    │
                  │  To Printer      │
                  └─────────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  EPSON L3115   │
                    │  Printer       │
                    └────────────────┘
```

## Hardware Setup

### 1. ESP32 DevKit V1 Connections

#### I2C (OLED)
- GPIO 21 (SDA) → OLED SDA
- GPIO 22 (SCL) → OLED SCL
- GND → OLED GND
- 3.3V → OLED VCC

#### Keypad (Push Buttons with Pull-ups)
| Button | GPIO | Label |
|--------|------|-------|
| 0      | 32   | 0     |
| 1      | 33   | 1     |
| 2      | 25   | 2     |
| 3      | 26   | 3     |
| 4      | 27   | 4     |
| 5      | 14   | 5     |
| 6      | 12   | 6     |
| 7      | 13   | 7     |
| 8      | 4    | 8     |
| 9      | 5    | 9     |
| ENTER  | 15   | Enter |

**Button Wiring**: Each button connects GPIO to GND when pressed. GPIO is pulled high by internal resistor.

#### Serial (Pico Communication)
- GPIO 17 (TX2) → Pico RX (GPIO 9)
- GPIO 16 (RX2) → Pico TX (GPIO 8)
- GND → Pico GND

### 2. Raspberry Pi Pico Connections

#### UART1 (ESP32 Communication)
- GPIO 8 (TX1) → ESP32 RX (GPIO 16)
- GPIO 9 (RX1) → ESP32 TX (GPIO 17)
- GND → ESP32 GND

#### USB to Printer
- USB-A Female Port connected to Pico USB connector
- Pins: 5V, GND, D+, D- (standard USB)

## Firmware Installation

### ESP32 Setup

1. **Install Arduino IDE**
   - Download from https://www.arduino.cc/en/software

2. **Add ESP32 Board Support**
   - File → Preferences
   - Additional Boards Manager URLs:
     ```
     https://dl.espressif.com/dl/package_esp32_index.json
     ```
   - Tools → Board Manager → Search "esp32" → Install

3. **Install Required Libraries**
   ```
   Sketch → Include Library → Manage Libraries
   - Adafruit SSD1306
   - Adafruit GFX Library
   - ArduinoJson
   ```

4. **Configure Board**
   - Board: ESP32 Dev Module
   - Upload Speed: 921600
   - Flash Frequency: 80MHz
   - Flash Mode: DIO
   - Flash Size: 4MB
   - Partition Scheme: Default 4MB with spiffs
   - Core Debug Level: None

5. **Update Configuration**
   - Edit `config.h`:
     ```cpp
     #define WIFI_SSID "your_wifi_ssid"
     #define WIFI_PASSWORD "your_wifi_password"
     ```

6. **Upload**
   - Select COM port
   - Click Upload

### Pico Setup

1. **Install Pico SDK**
   ```bash
   git clone https://github.com/raspberrypi/pico-sdk.git
   cd pico-sdk
   git submodule update --init
   ```

2. **Set Environment Variable**
   ```bash
   export PICO_SDK_PATH=~/pico-sdk
   ```

3. **Build Firmware**
   ```bash
   cd firmware/pico_printer
   mkdir build
   cd build
   cmake ..
   make
   ```

4. **Upload to Pico**
   - Connect Pico to PC with USB cable
   - Hold BOOTSEL button while connecting
   - Copy `pico_printer.uf2` to RPI-RP2 drive
   - Pico will reboot automatically

## API Endpoints

All endpoints require the kiosk to be connected to WiFi.

### 1. Fetch Print Job

**GET** `/api/kiosk/print-job/:printId`

**Response:**
```json
{
  "success": true,
  "printJob": {
    "id": "uuid",
    "print_id_numeric": 843276,
    "email": "user@email.com",
    "status": "PENDING",
    "file_count": 2,
    "color_mode": "COLOR",
    "duplex_mode": "LONG_EDGE",
    "copies": 1,
    "total_amount": 45
  },
  "files": [
    {
      "id": "uuid",
      "file_name": "document.pdf",
      "file_size": 1024000,
      "file_type": "pdf",
      "page_count": 39
    }
  ]
}
```

### 2. Update Print Job Status

**PUT** `/api/kiosk/print-job/:printId/status`

**Request Body:**
```json
{
  "status": "PRINTING|COMPLETED|ERROR",
  "error_message": "Optional error details"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Print job status updated to COMPLETED"
}
```

### 3. Download File

**GET** `/api/kiosk/print-job/:printId/download-file?fileIndex=0`

**Response:**
```json
{
  "success": true,
  "file": {
    "name": "document.pdf",
    "type": "pdf",
    "size": 1024000,
    "pageCount": 39,
    "data": "base64_encoded_file_data"
  }
}
```

## Serial Protocol (ESP32 ↔ Pico)

### ESP32 → Pico Commands

| Command | Format | Description |
|---------|--------|-------------|
| START_PRINT | `START_PRINT:printId:fileCount` | Begin printing job |
| CANCEL | `CANCEL:printId` | Cancel active print job |
| STATUS | `STATUS` | Request printer status |

### Pico → ESP32 Messages

| Message | Description |
|---------|-------------|
| READY | Pico initialized and ready |
| PICO_READY | Response to ESP handshake |
| PRINTING | Print job started |
| COMPLETE | Print job completed |
| CANCELLED | Print job cancelled |
| ERROR_OFFLINE | Printer is offline |
| ERROR_PAPER | No paper in printer |
| ERROR_TEMPERATURE | Printer temperature error |

## Operation Flow

1. **User arrives at kiosk**
   - ESP32 displays welcome screen
   - WiFi connects to network
   - System shows "Ready"

2. **User enters Print ID**
   - Press numeric buttons to enter ID (0-9)
   - Press ENTER to submit
   - ESP32 shows "Fetching..."

3. **ESP32 fetches job**
   - Calls `/api/kiosk/print-job/843276`
   - Gets print job details and file list
   - Downloads first file

4. **ESP32 sends to Pico**
   - Sends `START_PRINT:843276:2`
   - Pico receives command
   - Pico initializes printer

5. **Printing**
   - Pico sends file data to printer via USB
   - Handles printer status
   - Monitors for errors

6. **Completion**
   - Pico sends `COMPLETE`
   - ESP32 shows success screen
   - Updates database via `/api/kiosk/print-job/843276/status`
   - Returns to welcome screen after timeout

## Troubleshooting

### ESP32 Issues

**WiFi won't connect**
- Check SSID and password in config.h
- Check WiFi signal strength
- Reset ESP32

**OLED not displaying**
- Check I2C address (default 0x3C)
- Verify SDA/SCL connections
- Check 3.3V power

**Buttons not responding**
- Test with Serial Monitor
- Check GPIO connections
- Verify internal pull-ups

### Pico Issues

**Not detecting Pico**
- Hold BOOTSEL while connecting
- Try different USB cable
- Check PICO_SDK_PATH environment variable

**Serial communication fails**
- Verify baud rate (115200)
- Check TX/RX connections (note: they swap)
- Add ground connection between ESP32 and Pico

### Printer Issues

**Not printing**
- Check printer is powered on
- Verify USB connection
- Check paper and ink levels
- Restart Pico

**Print quality**
- Check printer settings (quality, speed)
- Verify file format (should be converted to printer format)
- Clean printer head

## File Format Handling

Current implementation supports:
- **PDF**: Converted to images on backend
- **DOC/DOCX**: Converted to PDF then images
- **PPT**: Converted to PDF then images
- **XLS**: Converted to PDF then images
- **Images**: Sent directly to printer

### Conversion Pipeline

1. User uploads file (various formats)
2. Backend stores original file
3. On first print request:
   - Convert to PDF (if needed)
   - Convert PDF to printer-compatible format
   - Cache converted version
   - Send to Pico

## Future Enhancements

- [ ] Multi-file printing in sequence
- [ ] Print preview on OLED (image preview)
- [ ] Print job queue management
- [ ] Touchscreen interface (7" IPS)
- [ ] Card payment integration
- [ ] QR code generation for print ID
- [ ] Cloud backup of print logs
