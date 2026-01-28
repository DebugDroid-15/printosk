# UART Protocol Specification (ESP32 ↔ Pico)

Low-level serial communication protocol for hardware integration.

## Physical Layer

- **Port**: UART2 (ESP32) ↔ UART0 (Pico)
- **Baud Rate**: 115200
- **Data Bits**: 8
- **Stop Bits**: 1
- **Parity**: None (8N1)
- **Flow Control**: None (RTS/CTS disabled)
- **Max Cable Length**: 5 meters (typical)

## Frame Structure

All UART communication uses a frame-based protocol with error detection.

```
┌──────┬────────┬──────┬──────────────────┬─────┬──────┐
│START │ LENGTH │ TYPE │    PAYLOAD       │ CRC │ END  │
├──────┼────────┼──────┼──────────────────┼─────┼──────┤
│ 0xAA │ 2 byte │ 1by  │ 0-512 bytes      │ 1by │ 0xBB │
└──────┴────────┴──────┴──────────────────┴─────┴──────┘
```

### Field Descriptions

| Field | Size | Value | Description |
|-------|------|-------|-------------|
| START | 1 byte | 0xAA | Frame delimiter (start marker) |
| LENGTH | 2 bytes | 0-512 | Payload length in bytes (little-endian, uint16) |
| TYPE | 1 byte | varies | Message type identifier (0x01-0xFF) |
| PAYLOAD | 0-512 bytes | varies | Actual message content (JSON or binary) |
| CRC | 1 byte | varies | CRC8-CCITT over [TYPE + PAYLOAD] |
| END | 1 byte | 0xBB | Frame delimiter (end marker) |

### Frame Example

PING message:
```
0xAA 0x00 0x00 0x01 0xFE 0xBB
     └─────────────────────────┘
         LENGTH=0, TYPE=0x01, CRC=0xFE
```

PRINT command with JSON payload:
```
0xAA [LEN_LOW] [LEN_HIGH] 0x10 [JSON...] [CRC] 0xBB
```

If JSON is 100 bytes:
```
0xAA 0x64 0x00 0x10 [100-byte JSON] [CRC] 0xBB
```

---

## Message Types

### 0x01: PING / PONG
**Direction**: Bidirectional  
**Purpose**: Health check, connection test

#### ESP32 → Pico: PING Request
```json
{
  "type": 1
}
```

#### Pico → ESP32: PONG Response
```json
{
  "type": 1,
  "status": 0
}
```

---

### 0x10: PRINT_COMMAND
**Direction**: ESP32 → Pico  
**Purpose**: Send print job to Pico

**Payload** (JSON):
```json
{
  "type": 16,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "total_pages": 5,
  "color": true,
  "copies": 2,
  "file_url": "https://supabase.co/storage/v1/object/print-files/jobs/...",
  "mock_mode": false
}
```

**Fields**:
- `job_id` (string, 36 chars): UUID of print job
- `total_pages` (int): Expected number of pages
- `color` (bool): true = color, false = B&W
- `copies` (int): Number of copies (1-100)
- `file_url` (string): Signed URL to download file from Supabase
- `mock_mode` (bool): If true, simulate print without real printer

---

### 0x11: CANCEL_COMMAND
**Direction**: ESP32 → Pico  
**Purpose**: Cancel active print job

**Payload** (JSON):
```json
{
  "type": 17,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01"
}
```

---

### 0x20: STATUS_RESPONSE
**Direction**: Pico → ESP32  
**Purpose**: Report job status

**Payload** (JSON):
```json
{
  "type": 32,
  "status": 1,
  "progress": 25,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "message": "Printing page 1 of 5"
}
```

**Status Codes**:
- `0`: READY (idle)
- `1`: STARTED (job initiated)
- `2`: PRINTING (active printing)
- `3`: DONE (completed successfully)
- `4`: ERROR (failed with error)
- `5`: CANCELLED (cancelled by user)

---

### 0x30: ERROR_RESPONSE
**Direction**: Pico → ESP32  
**Purpose**: Report error

**Payload** (JSON):
```json
{
  "type": 48,
  "error_code": 1001,
  "message": "Printer offline",
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01"
}
```

**Error Codes**:
- `1001`: Printer offline
- `1002`: Print timeout exceeded
- `1003`: Printer paper jam
- `1004`: Printer out of paper
- `1005`: JSON parse error
- `1006`: File download failed
- `1007`: Invalid job ID
- `2001`: UART frame error
- `2002`: CRC checksum failed

---

### 0xFF: ACK (Acknowledgment)
**Direction**: Bidirectional  
**Purpose**: Confirm frame reception

**Payload** (JSON):
```json
{
  "type": 255,
  "sequence": 5
}
```

---

## State Diagram (Pico)

```
┌─────────────┐
│    IDLE     │ Power-up or after job complete
└──────┬──────┘
       │ Receive PRINT_COMMAND
       ↓
┌─────────────────────┐
│   INITIALIZING      │ Verify job, download file
└──────┬──────────────┘
       │ Ready or Error
       ├─────────────────→ [ERROR] send ERROR_RESPONSE
       │
       ↓
┌─────────────────────┐
│   PRINTING          │ Execute print job
└──────┬──────────────┘
       │ Complete or Error
       ├─────────────────→ [ERROR] send ERROR_RESPONSE
       │
       ↓
┌─────────────────────┐
│   DONE              │ Send success response
└──────┬──────────────┘
       │
       ↓
     [IDLE]
```

---

## Timing & Timeouts

| Event | Timeout | Description |
|-------|---------|-------------|
| Frame reception | 5000 ms | Max time to receive complete frame |
| Command ACK | 1000 ms | Max time to get acknowledgment |
| Print command | 300000 ms | Max time for entire print job (5 min) |
| Status update | 1000 ms | Max time between progress updates |

---

## CRC Calculation

CRC8-CCITT checksum over [TYPE + PAYLOAD]:

```c
uint8_t crc8(const uint8_t* data, int len) {
  uint8_t crc = 0xFF;
  for (int i = 0; i < len; i++) {
    crc ^= data[i];
    for (int j = 0; j < 8; j++) {
      if (crc & 0x80) {
        crc = (crc << 1) ^ 0x07;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFF;
    }
  }
  return crc;
}
```

### Example CRC Calculation

For PING message (type=0x01, no payload):
```
data = [0x01]
crc8([0x01]) = 0xFE
```

---

## Protocol Flow Examples

### Successful Print

```
ESP32                           Pico
  │                             │
  ├─ FRAME[PRINT_COMMAND] ─────>│
  │ job_id=123...              │
  │ pages=5, color=true        │
  │ file_url=...               │
  │                             │
  │<─ FRAME[STATUS] ───────────┤
  │ status=STARTED             │
  │ progress=0                 │
  │                             │
  │                   [File download...]
  │                   [Print initiate...]
  │                             │
  │<─ FRAME[STATUS] ───────────┤
  │ status=PRINTING            │
  │ progress=20                │
  │                             │
  │                   [Page 1-2...]
  │                             │
  │<─ FRAME[STATUS] ───────────┤
  │ status=PRINTING            │
  │ progress=50                │
  │                             │
  │                   [Page 3-5...]
  │                             │
  │<─ FRAME[STATUS] ───────────┤
  │ status=DONE                │
  │ progress=100               │
  │ message="Print complete"   │
  │                             │
```

### Error Handling

```
ESP32                           Pico
  │                             │
  ├─ FRAME[PRINT_COMMAND] ─────>│
  │                             │
  │                   [Printer not found]
  │                             │
  │<─ FRAME[ERROR] ────────────┤
  │ error_code=1001            │
  │ message="Printer offline"  │
  │                             │
```

### Frame Error Recovery

```
ESP32                           Pico
  │                             │
  ├─ FRAME[CORRUPTED] ────────>│
  │                             │
  │                   [Invalid CRC detected]
  │                             │
  │<─ FRAME[ERROR] ────────────┤
  │ error_code=2002            │
  │ message="CRC failed"       │
  │                             │
  ├─ FRAME[PRINT_COMMAND] ─────>│ [Retry]
  │                             │
```

---

## Debugging & Logging

### Serial Monitor Output (Pico)

```
[INFO] Received 42 bytes from ESP32
[INFO] UART Frame: START=0xAA, LEN=36, TYPE=0x10, CRC=0x45
[INFO] Payload: {"type":16,"job_id":"123...","total_pages":5,...}
[INFO] Command parsed: PRINT_COMMAND
[INFO] Starting print job...
[INFO] Status: STARTED (0%)
[INFO] Status: PRINTING (50%)
[INFO] Status: DONE (100%)
```

### Testing with Serial Tools

Using `minicom` or `picocom`:

```bash
# Monitor Pico UART output
picocom -b 115200 /dev/ttyUSB0

# Send test PING (manual entry is difficult, use script instead)
```

Use Python script for testing:

```python
import serial
import json
import time

port = serial.Serial('/dev/ttyUSB0', 115200, timeout=1)

# Send PING
ping = b'\xAA\x00\x00\x01\xFE\xBB'
port.write(ping)

# Read response
response = port.read(6)
print("Response:", response.hex())
```

---

## Implementation Checklist

- [ ] ESP32: UART initialization (115200, 8N1)
- [ ] ESP32: Frame encoding/decoding
- [ ] ESP32: CRC calculation
- [ ] ESP32: Timeout handling
- [ ] ESP32: JSON serialization
- [ ] Pico: UART initialization
- [ ] Pico: Frame parsing
- [ ] Pico: CRC verification
- [ ] Pico: JSON deserialization
- [ ] Pico: Status reporting
- [ ] Both: Error handling
- [ ] Both: Logging

---

## Migration & Versioning

If protocol changes are needed:

1. **Version 1.0** (current): As described above
2. **Future**: Add version field to frame header if needed

Current frame format is future-proof with LENGTH field allowing extensibility.

