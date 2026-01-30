# Quick Pico Testing Reference

## 🎯 Immediate Test (No Printer Needed)

### Step 1: Upload New Firmware
- Upload latest **Pico firmware** (commit c4784a9)
- Upload latest **ESP32 firmware** (commit c4784a9)

### Step 2: Open Serial Monitor
- ESP32 board selected
- Baud: **115200**

### Step 3: Check for Heartbeat (10 seconds)
Should see every 5 seconds:
```
[Pico] HEARTBEAT
```

✅ **If YES**: Firmware updated, proceed to Step 4
❌ **If NO**: Old firmware on device, reflash now

### Step 4: Trigger Echo Test
On keypad: **Press 0 → 0 → 0** (within 3 seconds)

Should see:
```
========== PICO COMMUNICATION TEST ==========
[Pico] ECHO_RECEIVED: TEST_ECHO
========== TEST COMPLETE ==========
```

✅ **If YES**: Communication 100% working!
❌ **If NO**: Check UART wiring (GPIO 1/3)

---

## 🧪 Full Test (With Printer Nearby)

### Step 5: Test Print Command
On keypad: **Enter 837032** → **Press ENTER**

Should see in Serial Monitor:
```
[Pico] ===== PRINT COMMAND RECEIVED =====
[Pico] [STEP 1] Testing UART0 connection...
[Pico] [STEP 2] Initializing printer...
...through all 9 steps...
[Pico] [COMPLETE] Print job finished!
```

✅ **If YES**: Ready to connect printer!
❌ **If NO**: Command not reaching Pico

---

## 📋 What Each Test Verifies

| Test | Checks | If Working | If Failing |
|---|---|---|---|
| **Heartbeat** | Pico firmware loaded | See messages every 5s | Old firmware on device |
| **Echo (0-0-0)** | ESP32→Pico communication | See ECHO_RECEIVED | UART wiring broken |
| **Print Command** | Command parsing | See all 9 STEP messages | Parsing or execution issue |

---

## 🔧 Baud Rates
- **ESP32 Serial Monitor**: 115200
- **ESP32↔Pico UART**: 115200 (GPIO 1 TX, 3 RX)
- **Pico↔Printer UART**: 115200 (GPIO 0 TX, 1 RX) - **May need 9600 for printer!**

---

## 📝 Expected Serial Output Flow

**Starting up:**
```
[WiFi] Connected
[Pico] Received: PICO_READY
[Pico] HEARTBEAT
```

**When you press 0-0-0:**
```
[Pico] ECHO_RECEIVED: TEST_ECHO
```

**When you enter Print ID + ENTER:**
```
[Pico] ===== PRINT COMMAND RECEIVED =====
[Pico] [STEP 1-9] ...
[Pico] [COMPLETE] Print job finished!
```

---

## 🐛 Quick Diagnostics

**No heartbeat → Old firmware on Pico**
- Solution: Recompile in Codespaces, reflash UF2

**Heartbeat works but no echo response → UART wiring**
- Solution: Check GPIO 1 (TX from Pico) and GPIO 3 (RX from ESP32)

**Echo works but print steps missing → Parsing issue**
- Solution: Check START_PRINT:JOBID:FILECOUNT format

**All works but no printer output → Printer issue**
- Solution: Check GPIO 0/1 to printer, check baud rate (try 9600), verify 5V power
