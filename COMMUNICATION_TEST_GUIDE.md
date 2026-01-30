# Pico Communication Testing Guide (No Printer Required)

Without a physical printer, you can still fully test the ESP32↔Pico communication pathway.

## Quick Start: Heartbeat Test

This is the **easiest and fastest** verification:

1. **Open Serial Monitor** in Arduino IDE
   - Select ESP32 board
   - Baud rate: **115200**

2. **Look for HEARTBEAT messages**
   ```
   [Pico] HEARTBEAT
   [Pico] HEARTBEAT
   [Pico] HEARTBEAT
   ```
   - Should appear **every 5 seconds**
   - If you see these, ✅ **Pico firmware is updated and working**
   - If you DON'T see these, ❌ **Old firmware on device - needs reflashing**

**Expected output every 5 seconds:**
```
[Pico] HEARTBEAT
[Pico] HEARTBEAT
[Pico] HEARTBEAT
```

---

## Test #1: Echo Test (Firmware Verification)

### Purpose
Verify that the **new Pico firmware is loaded** and communicating properly.

### How to Run

1. **Upload latest ESP32 firmware** with the test function
2. **Open Serial Monitor** (115200 baud)
3. **Press keypad buttons: 0 → 0 → 0** (quickly, within 3 seconds)
   - This triggers a diagnostic test
   - Look for the test header in serial output

### Expected Output

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

### What It Tests

| Expected Output | Meaning |
|---|---|
| `[Pico] HEARTBEAT` appearing | ✅ Pico firmware is updated |
| `[Pico] ECHO_RECEIVED: TEST_ECHO` | ✅ Pico received command correctly |
| No HEARTBEAT after 10 seconds | ❌ Old firmware on device - reflash needed |
| No ECHO_RECEIVED response | ❌ Communication broken - check UART wiring |

---

## Test #2: Command Parsing Test

### Purpose
Verify that Pico **correctly parses print commands**.

### How to Run

1. **Open Arduino IDE Serial Monitor** (115200 baud)
2. **Manually send a command** from the Serial Monitor to verify it gets through
3. **Enter any 5-digit Print ID** on the keypad (e.g., 837032)
4. **Press ENTER** to trigger the actual print command

### Expected Output in Serial Monitor

```
[Pico] DEBUG: Preparing to send: START_PRINT:837032:1
START_PRINT:837032:1
[Pico] Sent: START_PRINT:837032:1
[Pico] Buffer flushed
[Pico] ===== PRINT COMMAND RECEIVED =====
[Pico] Command: START_PRINT:837032:1
[Pico] [OK] Command parsed
[Pico] [OK] Job: 837032 Files: 1
[Pico] [STEP 1] Testing UART0 connection...
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

### What It Tests

| Expected Output | Meaning |
|---|---|
| `[OK] Command parsed` | ✅ Pico understands the command format |
| `[STEP 1]` through `[STEP 9]` | ✅ All processing steps executed |
| `[COMPLETE] Print job finished!` | ✅ Complete command execution sequence working |
| Missing steps | ❌ Command execution interrupted - check for errors |

---

## Test #3: Manual UART Test (Advanced)

If heartbeat/echo don't work, manually test the UART connection.

### In Arduino IDE Serial Monitor

1. Open Serial Monitor for ESP32 (115200 baud)
2. Type and send: `ESP_READY`
3. You should immediately see: `PICO_READY`

**Expected:**
```
Sending: ESP_READY
PICO_READY
```

**If you see `PICO_READY`**: ✅ Basic UART is working, firmware issue likely
**If you see nothing**: ❌ UART wiring problem - check GPIO 1/3 connections

---

## Test #4: Verify Pico Code on Device

Use the Pico's **onboard LED** to verify command reception:

### How It Works
- Every time Pico receives a valid command, the LED blinks
- Every time a print command arrives, the LED blinks 3 times
- Every time an echo test arrives, the LED blinks 1 time

### Watch for LED Blinks

| LED Pattern | Meaning |
|---|---|
| No blink ever | ❌ Firmware very old or not loaded |
| Blink 1x when you press 0-0-0 | ✅ Echo test received |
| Blink 3x when you enter Print ID | ✅ Print command received |

---

## Troubleshooting Matrix

| Symptom | Diagnosis | Fix |
|---|---|---|
| No HEARTBEAT every 5s | Old Pico firmware on device | **Recompile and reflash** |
| HEARTBEAT exists but no ECHO_RECEIVED | Command not reaching Pico | Check ESP32 UART initialization (GPIO 3/1) |
| HEARTBEAT + ECHO exists but no PRINT steps | Command parsing broken | Check START_PRINT command format in ESP32 code |
| All messages present but no printer output | Printer UART issue | Check GPIO 0/1 connections to printer (22Ω resistors) |
| Pico reboots when print command sent | Power issue or firmware crash | Check power supply, verify Pico has 5V |

---

## Step-by-Step Verification Checklist

### ✅ First Check: Heartbeat (30 seconds)
```
1. Upload latest Pico firmware
2. Open Serial Monitor (ESP32, 115200 baud)
3. Wait 10 seconds
4. Do you see [Pico] HEARTBEAT every 5 seconds?
   YES → Firmware updated, go to Test #2
   NO → Old firmware on device, reflash now
```

### ✅ Second Check: Echo (1 minute)
```
1. Upload latest ESP32 firmware
2. Open Serial Monitor
3. On keypad: Press 0 → 0 → 0 (within 3 seconds)
4. Do you see [Pico] ECHO_RECEIVED?
   YES → Communication working, test print commands
   NO → UART wiring issue, verify GPIO 1/3
```

### ✅ Third Check: Print Command (2 minutes)
```
1. On keypad: Enter 837032 (or any Print ID)
2. Press ENTER
3. In Serial Monitor, do you see all 9 STEP messages?
   YES → Command parsing working, check printer power
   NO → Command not reaching Pico or being parsed, check code
```

### ✅ Final Check: Printer Output (requires printer)
```
1. Connect printer power (5V USB)
2. Connect printer UART (GPIO 0/1)
3. Verify UART0 communication in Serial Monitor
4. Send print command
5. Watch for paper movement
```

---

## Debug Commands Reference

### For ESP32 Serial Monitor

Send these from Serial Monitor to ESP32:

| Command | Purpose |
|---|---|
| `ESP_READY` | Test basic UART to Pico |
| (Press 0-0-0) | Run full communication test |

### For Pico (via ESP32)

The ESP32 can send these to Pico:

| Command | Response |
|---|---|
| `ESP_READY` | `PICO_READY` |
| `TEST_ECHO` | `[Pico] ECHO_RECEIVED: TEST_ECHO` |
| `START_PRINT:JOBID:FILECOUNT` | Full print sequence output |

---

## Sample Successful Session

```
Serial Monitor Output (115200 baud):
---
[WiFi] Connected to Manakusakuuuu
[WiFi] IP: 10.159.4.45
[Pico] Received: PICO_READY
[Pico] HEARTBEAT
[Pico] HEARTBEAT
[Pico] HEARTBEAT
[Pico] DEBUG: Preparing to send: START_PRINT:837032:1
START_PRINT:837032:1
[Pico] Sent: START_PRINT:837032:1
[Pico] Buffer flushed
[Pico] ===== PRINT COMMAND RECEIVED =====
[Pico] Command: START_PRINT:837032:1
[Pico] [OK] Command parsed
[Pico] [OK] Job: 837032 Files: 1
[Pico] [STEP 1] Testing UART0 connection...
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
[Pico] HEARTBEAT
---
Result: ✅ ALL COMMUNICATION WORKING - Ready for real printer!
```

---

## Next Steps After Tests Pass

Once all tests above pass, you're ready to:

1. ✅ Physical printer connection (GPIO 0/1 with 22Ω resistors)
2. ✅ Power verification (printer needs 5V USB)
3. ✅ Actual receipt printing
4. ✅ Troubleshoot any remaining printer-specific issues

The **communication pipeline is verified** - any remaining issues are printer-specific (baud rate, voltage, or command format).
