# Pico Communication Test Plan

## Overview
These tests verify the complete ESP32↔Pico communication pathway **without requiring a physical printer**. You can test all communication logic, command parsing, and response handling.

---

## Test Environment Setup

### What You Need
- ✅ ESP32 DevKit V1 (programmed with latest firmware)
- ✅ Raspberry Pi Pico (with latest firmware)
- ✅ OLED display connected to ESP32
- ✅ 11-button keypad connected to ESP32
- ✅ USB cable to ESP32 for Serial Monitor
- ❌ **Printer NOT required** - all tests work without it!

### What You Don't Need
- Printer (not required for these tests)
- Printer power supply
- Any printer connection

---

## Pre-Test Checklist

### Hardware Verification
- [ ] ESP32 connects to WiFi (check serial output)
- [ ] OLED displays welcome screen
- [ ] Keypad buttons work (press 0-9 and ENTER)
- [ ] Serial Monitor shows heartbeat every 5 seconds from Pico

### Firmware Verification
- [ ] Latest Pico firmware uploaded
- [ ] Latest ESP32 firmware uploaded
- [ ] Git commits c4784a9 or later

### Connection Verification
- [ ] GPIO 1 (Pico TX) → GPIO 3 (ESP32 RX) - UART working
- [ ] GPIO 3 (Pico RX) ← GPIO 1 (ESP32 TX) - UART working
- [ ] No loose wires or cold solder joints

---

## Test Suite

### Test 1: Heartbeat Detection
**Duration**: 30 seconds  
**Difficulty**: Easy  
**Purpose**: Verify Pico firmware is loaded and running

#### Steps
1. Power on ESP32 and Pico
2. Open Serial Monitor (115200 baud)
3. Wait 10 seconds for system to stabilize
4. Observe for HEARTBEAT messages

#### Expected Output
```
[Pico] Received: PICO_READY
[Pico] HEARTBEAT
[Pico] HEARTBEAT
[Pico] HEARTBEAT
```
(Every 5 seconds)

#### Pass Criteria
✅ HEARTBEAT appears at least 2 times within 15 seconds

#### Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| No HEARTBEAT ever | Old firmware on Pico | Reflash with latest UF2 |
| HEARTBEAT then stops | Pico crashed | Check power supply |
| Irregular intervals | Timing issue | Recompile with `cmake` |

#### Why This Matters
The heartbeat proves:
- Pico firmware is running
- Pico UART1 is initialized
- Pico can send data back to ESP32
- No data corruption in simple transmission

---

### Test 2: Echo Test
**Duration**: 1 minute  
**Difficulty**: Easy  
**Purpose**: Verify bidirectional UART communication

#### Steps
1. Pass Test 1 first
2. On physical keypad: **Press 0, then 0, then 0** (within 3 seconds)
3. Watch Serial Monitor output
4. System will send TEST_ECHO to Pico
5. Pico should respond with ECHO_RECEIVED

#### Expected Output
```
========== PICO COMMUNICATION TEST ==========
1. Checking for HEARTBEAT (should appear every 5 seconds)
2. Sending TEST_ECHO command...
[Pico] DEBUG: Preparing to send: TEST_ECHO
TEST_ECHO
[Pico] Sent: TEST_ECHO
[Pico] Buffer flushed
3. Waiting 5 seconds for Pico responses...
.....
[Pico] ECHO_RECEIVED: TEST_ECHO
[Pico] HEARTBEAT
==========================================
```

#### Pass Criteria
✅ See `[Pico] ECHO_RECEIVED: TEST_ECHO` within 5 seconds of pressing 0-0-0

#### Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| No ECHO_RECEIVED | Command not reaching Pico | Check GPIO 1/3 wiring |
| ECHO_RECEIVED but HEARTBEAT stops | Pico stalled on echo | Check for buffer issues |
| See TEST_ECHO echoed back | UART loopback detected | Disconnect one wire momentarily |

#### Why This Matters
Echo test verifies:
- ESP32 can send data to Pico
- Pico receives data correctly
- Pico can send data back to ESP32
- Full duplex communication working
- Buffer management working

---

### Test 3: Print Command Structure
**Duration**: 2 minutes  
**Difficulty**: Medium  
**Purpose**: Verify command parsing and sequence execution

#### Steps
1. Pass Test 1 and Test 2 first
2. On keypad: Enter any 5-digit number (e.g., **837032**)
3. Press **ENTER**
4. Watch for all 9 STEP messages
5. System will fetch job from API and send to Pico

#### Expected Output (in Serial Monitor)
```
[API] Fetching print job: 837032
[API] Job found - Status: PENDING
[Pico] DEBUG: Preparing to send: START_PRINT:837032:1
START_PRINT:837032:1
[Pico] Sent: START_PRINT:837032:1
[Pico] Buffer flushed
[Pico] ===== PRINT COMMAND RECEIVED =====
[Pico] Command: START_PRINT:837032:1
[Pico] [OK] Command parsed
[Pico] [OK] Job: 837032 Files: 1
[Pico] [STEP 1] Testing UART0 connection...
[Pico] TEST: Complete
[Pico] [STEP 2] Initializing printer...
[Pico] [STEP 3] Printing header...
[Pico] [STEP 4] Printing title...
[Pico] [STEP 5] Printing timestamp...
[Pico] [STEP 6] Printing separator...
[Pico] [STEP 7] Printing job info...
[Pico] [STEP 8] Printing footer...
[Pico] [STEP 9] Cutting paper...
[Pico] [COMPLETE] Print job finished!
[Pico] ===== END PRINT COMMAND =====
```

#### Pass Criteria
✅ See all 9 STEP messages in order  
✅ See `[COMPLETE]` message  
✅ No error messages or interrupted steps

#### Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| Stops at STEP 1 | UART0 (printer UART) not initialized | Check Pico GPIO 0/1 setup |
| Stops at STEP 2 | Printer UART timeout | Verify UART0 baud rate |
| Missing middle steps | Parsing error | Check sscanf() format in Pico code |
| Sees ERROR message | Invalid command format | Verify START_PRINT:JOBID:FILECOUNT |

#### Why This Matters
This test verifies:
- Full command reaches Pico without corruption
- Command format is parsed correctly
- All processing steps execute in order
- Pico can handle complex multi-step sequences
- Communication stays stable during long operations

---

### Test 4: Stress Test (Optional)
**Duration**: 5 minutes  
**Difficulty**: Medium  
**Purpose**: Verify system stability under repeated commands

#### Steps
1. Pass Tests 1-3 first
2. Repeatedly enter print IDs and press ENTER
3. Send at least 5 consecutive print commands
4. Watch for any dropped messages or corrupted data

#### Expected Behavior
- Each command produces all 9 STEP messages
- No degradation after multiple commands
- Heartbeat continues throughout
- No data corruption

#### Pass Criteria
✅ All 5+ print commands execute fully  
✅ No error messages or garbled output  
✅ Heartbeat continues every 5 seconds

#### Why This Matters
Stress testing verifies:
- No buffer overflows
- No UART synchronization issues
- System stable over extended operation
- Ready for production use

---

## Troubleshooting Decision Tree

```
START: Does system show any output?
├─ NO → Check USB cable, ESP32 is powered, Serial Monitor settings
├─ YES → Is HEARTBEAT appearing?
    ├─ NO → Old Pico firmware on device
    │   └─ Fix: Recompile and reflash Pico UF2
    ├─ YES → Try pressing 0-0-0 on keypad
        ├─ No response → UART not working
        │   └─ Check: GPIO 1 (Pico TX) soldered to GPIO 3 (ESP32 RX)?
        ├─ See ECHO_RECEIVED → Communication working!
            └─ Try entering Print ID + ENTER
                ├─ No STEP messages → Parsing issue
                │   └─ Check: START_PRINT command format
                ├─ See all 9 STEPs → Ready for printer!
                    └─ Next: Connect printer, verify baud rate
```

---

## Communication Chain Verification

This diagram shows what each test verifies:

```
[ESP32] → [Pico] → [Printer]
   ↑         ↓
   └─────────┘
   (Test 1,2,3: These work!)
```

### Test 1: Pico → ESP32 (Heartbeat)
✅ Proves Pico firmware running  
✅ Proves UART receiver working on ESP32  
✅ Proves basic serial transmission working  

### Test 2: ESP32 ↔ Pico (Echo)
✅ Proves ESP32 → Pico transmission working  
✅ Proves Pico receiving correctly  
✅ Proves Pico can respond back  
✅ Proves full duplex UART working  

### Test 3: ESP32 → Pico → Printer (Command Sequence)
✅ Proves full command reaches Pico without corruption  
✅ Proves command parsing working  
✅ Proves Pico can execute complex multi-step sequences  
✅ **Proves ready for actual printer connection**

---

## Summary Table

| Test | What It Tests | Duration | Difficulty | Pass Indicator |
|---|---|---|---|---|
| **Test 1** | Pico firmware loaded | 30s | Easy | HEARTBEAT every 5s |
| **Test 2** | UART communication | 1m | Easy | ECHO_RECEIVED appears |
| **Test 3** | Command parsing | 2m | Medium | All 9 STEPs visible |
| **Test 4** | System stability | 5m | Medium | 5+ commands work |

---

## Next Steps After All Tests Pass

Once all 4 tests pass, you're ready to:

1. ✅ Connect physical printer to GPIO 0/1
2. ✅ Power up printer (5V USB)
3. ✅ Verify UART0 communication to printer
4. ✅ Adjust baud rate if needed (try 9600 if 115200 fails)
5. ✅ Send actual print commands
6. ✅ Watch for receipt paper output

The communication pipeline is **100% verified** and **ready for production**.

---

## Reference: Command Formats

### From ESP32 to Pico
```
ESP_READY              → Gets response: PICO_READY
TEST_ECHO             → Gets response: [Pico] ECHO_RECEIVED: TEST_ECHO
START_PRINT:ID:COUNT  → Gets response: 9 STEP messages + COMPLETE
```

### From Pico to ESP32
```
[Pico] HEARTBEAT                    (Every 5 seconds)
PICO_READY                          (Response to ESP_READY)
[Pico] ECHO_RECEIVED: TEST_ECHO    (Response to echo test)
[Pico] [STEP 1-9] ...              (Print sequence)
```

---

## Hardware Pin Reference

### ESP32 ↔ Pico UART
- **ESP32 GPIO 3** (RX) ← **Pico GPIO 1** (TX)
- **ESP32 GPIO 1** (TX) → **Pico GPIO 3** (RX)
- **Baud Rate**: 115200

### Pico ↔ Printer UART
- **Pico GPIO 1** (TX) → **Printer D+** (via 22Ω resistor)
- **Pico GPIO 0** (RX) ← **Printer D-** (via 22Ω resistor)
- **Common Ground**: Pico GND ← Printer GND
- **Baud Rate**: 115200 (or 9600 for EPSON L3115)

---

## Getting Help

If tests fail, check:
1. **Wiring**: Verify all GPIO connections with multimeter
2. **Firmware**: Verify latest code uploaded (`git log` shows recent commits)
3. **Serial Settings**: Check baud rate is 115200
4. **Power**: Verify both boards have stable power
5. **Serial Monitor**: Try different USB port or cable
