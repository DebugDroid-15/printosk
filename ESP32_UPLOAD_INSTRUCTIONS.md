# ESP32 Final Firmware - Upload Instructions

## 📋 What's in the Final Firmware

**Commit: `5b9f323`**

**Complete implementation includes:**
- ✅ Active Pico message listener (continuously drains UART buffer)
- ✅ Dedicated 512-byte Pico RX buffer (prevents message loss)
- ✅ WiFi connectivity with status tracking
- ✅ SH1106 OLED display support (128x64)
- ✅ 11-button numeric keypad (0-9 + ENTER)
- ✅ REST API integration for print jobs
- ✅ Echo test mode (press 0-0-0)
- ✅ Comprehensive logging to Serial Monitor
- ✅ Full error handling and status updates

---

## 🚀 Upload Instructions

### **Step 1: Download/Copy Final Firmware**

**Option A: From GitHub**
1. Go to: https://github.com/DebugDroid-15/printosk
2. Click `Code` → `Download ZIP`
3. Extract and find: `ESP32_FINAL_FIRMWARE.ino`

**Option B: Use File Here**
- File: `ESP32_FINAL_FIRMWARE.ino` (in workspace root)

### **Step 2: Open Arduino IDE**

1. **Arduino IDE** → **File** → **Open**
2. Navigate to and select: `ESP32_FINAL_FIRMWARE.ino`
3. The file will open in Arduino IDE

### **Step 3: Verify Configuration**

Before uploading, check your `config.h` file has:

```cpp
// WiFi Settings
#define WIFI_SSID "Manakusakuuuu"
#define WIFI_PASSWORD "your_password"

// API Settings
#define API_BASE_URL "https://printosk.vercel.app/api/kiosk"

// Pin Assignments
#define BUTTON_0_PIN 13
#define BUTTON_ENTER_PIN 15

// Baud Rates
#define PICO_BAUD_RATE 115200
#define PICO_SERIAL Serial  // GPIO 1 (TX), GPIO 3 (RX)
```

### **Step 4: Select Board & Port**

1. **Tools** → **Board** → **ESP32 Dev Module**
2. **Tools** → **Port** → Select your COM port (watch for ESP32 board)
3. **Tools** → **Upload Speed** → **921600**

### **Step 5: Upload**

1. Click **Upload** button (or Ctrl+U)
2. Wait for compilation (30-60 seconds)
3. Watch for: `Writing at ... (%)` progress
4. Should see: `Hash of data verified` 
5. Should see: `Hard resetting via RTS pin...`

**Success!** ✅

### **Step 6: Test**

Open **Serial Monitor** (Ctrl+Shift+M):
- Set baud rate: **115200**
- You should see startup messages:

```
[SYSTEM] Printosk ESP32 Kiosk Starting...
[Display] SH1106 Initialized
[Buttons] Initialized - 11 buttons ready
[Serial] Pico communication initialized on Serial (GPIO 3/1)
[Pico] Sending: ESP_READY
[WiFi] Connected!
[WiFi] IP: 10.159.4.45
[SYSTEM] Setup Complete!
[Pico] Received: PICO_READY
```

---

## ✨ Features to Test

### **Test 1: WiFi Connection**
- Should see: `[WiFi] Connected!` and IP address
- ✅ WiFi working

### **Test 2: Pico Communication**
- Wait 5 seconds
- Should see: `[Pico] HEARTBEAT - System alive and waiting for commands`
- ✅ Pico communication working (if new Pico firmware flashed)

### **Test 3: Echo Test**
- Press keypad: **0 → 0 → 0** (quickly)
- Should see in Serial Monitor:
  ```
  [Pico] DEBUG: Preparing to send: TEST_ECHO
  TEST_ECHO
  [Pico] Sent: TEST_ECHO
  [Pico] Buffer flushed
  [Pico] Received: [Pico] ECHO_RECEIVED: TEST_ECHO
  ```
- ✅ Communication working

### **Test 4: Print Job (if Pico has new firmware)**
- Enter Print ID on keypad (e.g., 837032)
- Press ENTER
- Should see all 9 STEP messages from Pico
- ✅ Full pipeline working

---

## 🔧 Troubleshooting Upload

| Problem | Solution |
|---|---|
| "Board not found" | Select correct board: ESP32 Dev Module |
| "COM port grayed out" | Check USB cable, try different port |
| "Compilation error" | Verify config.h exists in same folder |
| "Upload timeout" | Try lower Upload Speed (460800) |
| "Permission denied" | Restart Arduino IDE as administrator |

---

## 📝 File Details

**File:** `ESP32_FINAL_FIRMWARE.ino`

**Size:** ~20KB

**Features:**
- 555 lines of code
- Fully documented with section headers
- Active UART listener implementation
- Complete error handling
- Comprehensive Serial logging

**Dependencies Required:**
- Arduino.h (built-in)
- WiFi.h (built-in)
- HTTPClient.h (built-in)
- ArduinoJson.h (must install)
- Wire.h (built-in)
- Adafruit_GFX.h (must install)
- Adafruit_SH110X.h (must install)

**Install missing libraries:**
1. Arduino IDE → **Tools** → **Manage Libraries**
2. Search for: `ArduinoJson`
3. Click **Install** (by Benoit Blanchon)
4. Search for: `Adafruit SH110X`
5. Click **Install** (by Adafruit)

---

## 🎯 After Upload

1. ✅ Open Serial Monitor (115200 baud)
2. ✅ Verify startup messages appear
3. ✅ Check WiFi status
4. ✅ Test Pico communication (if Pico has new firmware)
5. ✅ Test keypad input
6. ✅ Test OLED display

---

## 📊 Expected Serial Output (First 10 seconds)

```
========================================
[SYSTEM] Printosk ESP32 Kiosk Starting...
========================================
[SYSTEM] Version: Final (Feb 1, 2026)
[SYSTEM] Commit: dbae7b3
[Display] Initializing SH1106 OLED...
[Display] SH1106 Initialized successfully
[Buttons] Initializing 11-button keypad...
[Buttons] All 11 buttons initialized (0-9 + ENTER)
[Serial] Initializing Pico UART communication...
[Serial] Pico communication on Serial (GPIO 3 RX, GPIO 1 TX)
[Serial] Baud rate: 115200
[Pico] Sending: ESP_READY
[WiFi] Connecting to: Manakusakuuuu
.......
[WiFi] Connected!
[WiFi] IP Address: 10.159.4.45
[SYSTEM] Setup Complete!
========================================

[Pico] Received: PICO_READY
```

✅ **If you see this → Upload successful!**

---

## 🎉 Success Criteria

After uploading and testing:
- ✅ Serial Monitor shows all startup messages
- ✅ WiFi connects automatically
- ✅ OLED displays welcome screen
- ✅ All 11 buttons respond to presses
- ✅ Pico communication active (messages flowing)
- ✅ Ready for Pico firmware flashing

---

## 📚 Reference

**Latest commits:**
- `5b9f323` - Final ESP32 firmware (this version)
- `dbae7b3` - Pico firmware fix (must be uploaded to Pico)
- `3099115` - Code verification docs

**Documentation:**
- See `ACTIVE_COMMUNICATION_GUIDE.md` for communication details
- See `CODE_VERIFICATION_AND_BUILD.md` for build info
- See `config.h` for all pin and API configuration

---

**You're now running the FINAL, complete ESP32 firmware!** 🚀
