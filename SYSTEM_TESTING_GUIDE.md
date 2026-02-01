# End-to-End System Testing Guide

## System Overview
- **ESP32**: Kiosk controller (WiFi, keypad, OLED display) - Arduino IDE
- **Pico**: Printer handler (UART receiver, mock print jobs) - MicroPython
- **Communication**: UART at 115200 baud (ESP32 GPIO16 TX → Pico GPIO1 RX)

---

## Step 1: Prepare Hardware

### Equipment Needed
- ESP32 DevKit V1
- Raspberry Pi Pico (with MicroPython)
- USB-to-Serial cable OR breadboard jumpers
- Micro USB cables for power

### Connection Diagram
```
ESP32 (Pin 16)  ────TX──→  Pico (GPIO1/Pin2)
ESP32 (Pin 17)  ←───RX───  Pico (GPIO0/Pin1)
ESP32 (GND)     ────────→  Pico (GND)

Baudrate: 115200
```

---

## Step 2: Deploy MicroPython to Pico

### Option A: Using Thonny IDE (Easiest)
1. Install Thonny from https://thonny.org/
2. Connect Pico (hold BOOTSEL while plugging in USB)
3. In Thonny: Tools → Options → Interpreter → MicroPython (Raspberry Pi Pico)
4. Create new file and paste contents of `firmware/pico_simple/main.py`
5. Save as `main.py` on Pico
6. Pico will auto-run main.py on startup

### Option B: Using rshell
```bash
pip install rshell
rshell
```
Then in rshell:
```
cp firmware/pico_simple/main.py /pyboard/main.py
```

### Verify Deployment
- Pico LED (GPIO25) should blink 3 times on startup
- Pico should print to console: "PICO MICROPYTHON CONTROLLER STARTED"

---

## Step 3: Upload ESP32 Firmware

1. Open Arduino IDE
2. Load `ESP32_FINAL_FIRMWARE.ino`
3. Select Board: ESP32 Dev Module
4. Upload to ESP32
5. Open Serial Monitor (115200 baud)

Expected output:
```
[ESP32] Starting WiFi...
[ESP32] Connected to WiFi
[ESP32] Initializing display...
[ESP32] System ready
```

---

## Step 4: Wire ESP32 to Pico

Connect UART between devices:
```
ESP32 GPIO16 (TX) → Pico GPIO1 (RX/Pin 2)
ESP32 GPIO17 (RX) → Pico GPIO0 (TX/Pin 1)
ESP32 GND → Pico GND
```

**Verify connections are solid** - loose connections cause missing bytes!

---

## Step 5: Test Communication

### Test 1: Heartbeat Exchange (Automatic)

ESP32 firmware automatically sends heartbeat every 5 seconds.

**Expected behavior:**
1. ESP32 sends: `ESP32_HEARTBEAT`
2. Pico receives and responds: `PICO_HEARTBEAT:0:READY`
3. ESP32 displays "Pico: ✓ ACTIVE"
4. Pico LED blinks once (fast)
5. Repeat every 5 seconds

**Verify in:**
- Pico: Thonny/rshell console shows "[PICO] Received: ESP32_HEARTBEAT"
- ESP32: Serial Monitor shows "Pico heartbeat received"

### Test 2: Echo Test (Manual via Keypad)

1. On keypad, press: **0 → 0 → 0** (Echo test)
2. ESP32 sends to Pico: `ECHO:TEST_MESSAGE`
3. Pico responds: `ECHO_RESPONSE:TEST_MESSAGE`

**Expected:**
- ESP32 displays "Echo response received"
- Pico console shows message received and sent

### Test 3: Status Request (Manual)

1. On keypad, press: **9 → 9 → 9** (Get Pico status)
2. ESP32 sends: `GET_STATUS`
3. Pico responds: `STATUS:IDLE:READY:True`

**Expected:**
- ESP32 displays Pico status on OLED
- Pico console shows status request processed

### Test 4: Mock Print Job (Simulated)

1. On keypad, press: **1 → 2 → 3** (Simulate print job)
2. ESP32 sends: `PRINT_JOB:JOB_12345`
3. Pico receives and responds: `JOB_RECEIVED:JOB_12345`
4. Pico "prints" for 5 seconds (LED blinks)
5. Pico sends: `JOB_COMPLETE:JOB_12345`

**Expected:**
- ESP32 displays job status changes
- Pico LED blinks 2x when job received, once when complete
- Pico console shows complete job lifecycle

---

## Step 6: Monitor Communication

### Using Pico Console (Thonny/rshell)
Should see:
```
[PICO] Received: ESP32_HEARTBEAT
[PICO] Sent: PICO_HEARTBEAT:0:READY
[PICO] Received: ECHO:TEST_MESSAGE
[PICO] Sent: ECHO_RESPONSE:TEST_MESSAGE
[PICO] Received: GET_STATUS
[PICO] Sent: STATUS:IDLE:READY:True
```

### Using ESP32 Serial Monitor
Should see:
```
[ESP32] UART buffer processed (1 message)
Pico heartbeat received: counter=0, status=READY
[ESP32] Pico communication OK
```

---

## Step 7: Full Integration Test

### Complete Workflow
1. Start ESP32 (WiFi connects, display initializes)
2. Start Pico (LED blinks 3x, console shows startup)
3. Wait 5 seconds → ESP32 sends heartbeat → Pico responds
4. Press 0-0-0 → Echo test → Pico responds
5. Press 9-9-9 → Status request → Pico reports IDLE
6. Press 1-2-3 → Mock print job → Pico "prints" for 5 seconds
7. Repeat every cycle to verify stability

### Success Criteria
- ✅ Heartbeat exchanges work every 5 seconds
- ✅ Echo test responds immediately
- ✅ Status requests show correct Pico state
- ✅ Mock print job executes without errors
- ✅ No UART message loss (all commands acknowledged)
- ✅ LED indicators match expected behavior
- ✅ No console errors or exceptions

---

## Troubleshooting

### Issue: Pico doesn't respond to anything

**Check:**
1. Is Pico running? (Should see startup messages in console)
2. Are UART connections correct? (TX→RX, RX→TX, GND→GND)
3. Is MicroPython deployed? (Open Pico console, should be responsive)

**Fix:**
- Reboot Pico (press reset button)
- Check serial connections with multimeter
- Redeploy main.py

### Issue: Heartbeat shows in Pico console but ESP32 doesn't receive response

**Check:**
1. Is ESP32 GPIO17 connected to Pico GPIO0 (TX)?
2. Are baud rates matching (115200)?
3. Try different USB port/cable

**Fix:**
- Swap RX/TX connections
- Verify no loose wires
- Reboot both devices

### Issue: Messages are corrupted or garbled

**Check:**
1. Baud rate mismatch
2. Loose USB connections
3. Distance between devices (keep under 1 meter)

**Fix:**
- Add shorter jumper cables
- Use high-quality USB cables
- Keep devices closer together

---

## Next Steps: When Printer Arrives

1. **Replace mock print job handler** in Pico firmware
   - Instead of 5-second sleep, send real printer commands
   - Use GPIO pins to trigger printer (parallel port protocol)
   - Read back printer status

2. **Add status feedback**
   - Pico reads paper sensor, temperature, error states
   - Sends back to ESP32 for display

3. **Convert MicroPython to C** (if needed)
   - All logic already proven in MicroPython
   - Just translate to C/C++ for performance
   - Use same UART protocol

---

## Documentation Files

- `ESP32_UPLOAD_INSTRUCTIONS.md` - Detailed ESP32 setup
- `COMMUNICATION_TEST_GUIDE.md` - Message protocol reference
- `TESTING_WITHOUT_PRINTER.md` - Testing scenarios without hardware

