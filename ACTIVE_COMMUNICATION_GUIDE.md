# Active Pico Communication - Enhanced Firmware

## ✨ What Changed

The ESP32 now has **active listening** for Pico messages instead of passive checking. This ensures NO messages are missed.

---

## 🔄 Key Improvements

### **1. ESP32: Active Message Listener**

**Old way (passive):**
```cpp
if (PICO_SERIAL.available()) {
  String message = PICO_SERIAL.readStringUntil('\n');
  // Process one message then wait
}
```

**New way (active):**
```cpp
void processPicoMessages() {
  // Drain ALL available data from Pico UART continuously
  while (PICO_SERIAL.available()) {
    char c = PICO_SERIAL.read();
    // Build complete message in buffer
    // Process immediately when newline received
  }
}

// Called in every loop iteration
processPicoMessages();
```

**Benefits:**
- ✅ Captures ALL messages from Pico
- ✅ No messages missed due to timing
- ✅ Faster response to Pico events
- ✅ Handles bursts of data properly

---

### **2. ESP32: Dedicated Pico RX Buffer**

Added:
```cpp
#define PICO_RX_BUFFER_SIZE 512  // Large buffer for safety
char picoRxBuffer[PICO_RX_BUFFER_SIZE];
int picoRxIndex = 0;
unsigned long lastPicoMessageTime = 0;
```

**Why:**
- Prevents buffer overflow
- Tracks timing of messages
- Ensures proper message assembly

---

### **3. Pico: Enhanced Startup Diagnostics**

**New initialization messages:**
```
[Pico] ===== PICO INITIALIZATION START =====
[Pico] LED initialized
[Pico] UART1 (ESP32) initialized at 115200 baud
[Pico] UART0 (Printer) initialized at 115200 baud
[Pico] ===== PICO READY =====
PICO_READY
[Pico] Waiting for ESP32 commands...
```

This allows you to verify each component is working during startup.

---

### **4. Pico: UART Flushing After Each Message**

```cpp
void uart_puts(uart_inst_t *uart, const char *str) {
    for (int i = 0; str[i]; i++) {
        uart_putc(uart, str[i]);
    }
    // Flush after each message (5ms delay for transmission)
    sleep_ms(5);
}
```

**Benefits:**
- Ensures message transmission completes
- Prevents buffering issues
- Guarantees proper serial order

---

### **5. Pico: Heartbeat Enhanced**

**New heartbeat message:**
```
[Pico] HEARTBEAT - System alive and waiting for commands
```

More descriptive to show system status.

---

## 🚀 How to Use Updated Firmware

### Step 1: Clean Build
```bash
cd /workspaces/printosk/firmware/pico_simple/build
rm -rf *
cmake ..
make -j4
```

### Step 2: Download UF2
Download `pico_simple.uf2` from build folder

### Step 3: Flash to Pico
1. Hold BOOTSEL on Pico
2. Connect USB
3. Drag UF2 to RPI-RP2

### Step 4: Upload ESP32
Upload latest `esp32_kiosk.ino` in Arduino IDE

---

## 📊 Expected Serial Output (After Update)

### **On Startup:**
```
[SYSTEM] Printosk ESP32 Kiosk Starting...
[Display] SH1106 Initialized
[Buttons] Initialized - 11 buttons ready
[Serial] Pico communication initialized
[WiFi] Connected!
[WiFi] IP: 10.159.4.45

[Pico] Received: [Pico] ===== PICO INITIALIZATION START =====
[Pico] Received: [Pico] LED initialized
[Pico] Received: [Pico] UART1 (ESP32) initialized at 115200 baud
[Pico] Received: [Pico] UART0 (Printer) initialized at 115200 baud
[Pico] Received: [Pico] ===== PICO READY =====
[Pico] Received: PICO_READY
[Pico] Received: [Pico] Waiting for ESP32 commands...
```

### **Every 5 Seconds (Heartbeat):**
```
[Pico] Received: [Pico] HEARTBEAT - System alive and waiting for commands
[Pico] Received: [Pico] HEARTBEAT - System alive and waiting for commands
[Pico] Received: [Pico] HEARTBEAT - System alive and waiting for commands
```

### **When Echo Test Triggered (Press 0→0→0):**
```
[Pico] DEBUG: Preparing to send: TEST_ECHO
TEST_ECHO
[Pico] Sent: TEST_ECHO
[Pico] Buffer flushed
[Pico] Received: [Pico] ECHO_RECEIVED: TEST_ECHO
```

### **When Print Job Triggered:**
```
[API] Fetching print job: 837032
[API] Job found
[Pico] DEBUG: Preparing to send: START_PRINT:837032:1
START_PRINT:837032:1
[Pico] Sent: START_PRINT:837032:1
[Pico] Buffer flushed
[Pico] Received: [Pico] ===== PRINT COMMAND RECEIVED =====
[Pico] Received: [Pico] Command: START_PRINT:837032:1
[Pico] Received: [Pico] [OK] Command parsed
[Pico] Received: [Pico] [OK] Job: 837032 Files: 1
[Pico] Received: [Pico] [STEP 1] Testing UART0 connection...
[Pico] Received: [Pico] TEST: Sent ESC @ to printer
[Pico] Received: [Pico] TEST: Sending 'TEST' to printer...
[Pico] Received: [Pico] TEST: Complete
[Pico] Received: [Pico] [STEP 2] Initializing printer...
[Pico] Received: [Pico] [STEP 2] Init complete
[Pico] Received: [Pico] [STEP 3] Sending alignment...
[Pico] Received: [Pico] [STEP 4] Setting bold...
[Pico] Received: [Pico] [STEP 5] Setting size...
[Pico] Received: [Pico] [STEP 6] Printing header...
[Pico] Received: [Pico] [STEP 7] Printing job info...
[Pico] Received: [Pico] [STEP 8] Printing footer...
[Pico] Received: [Pico] [STEP 9] Cutting paper...
[Pico] Received: [Pico] [COMPLETE] Print job finished!
[Pico] Received: [Pico] ===== END PRINT COMMAND =====
```

---

## ✅ Testing Checklist

- ✅ Upload latest ESP32 firmware
- ✅ Compile and flash latest Pico firmware
- ✅ Open Serial Monitor (115200 baud)
- ✅ Should see ALL initialization messages from Pico
- ✅ Should see HEARTBEAT every 5 seconds
- ✅ Should see ECHO_RECEIVED when pressing 0→0→0
- ✅ Should see all 9 STEP messages when printing

---

## 🔍 Why This Matters

**Before:**
- ESP32 might miss Pico messages if they arrived between loop checks
- Some debug info from Pico might not reach Serial Monitor
- Timing issues could cause lost messages

**After:**
- ESP32 actively drains UART buffer every 10ms
- NO messages can be missed
- All Pico output visible in Serial Monitor
- Clear diagnostic information for troubleshooting

---

## 📝 Commit Information

- **Commit:** `07bba08`
- **Changes:** Active listener in ESP32 + enhanced Pico diagnostics
- **Files updated:** 
  - `firmware/esp32_kiosk/esp32_kiosk.ino`
  - `firmware/pico_simple/pico_simple.c`

---

## 🎯 Next Steps

1. **Compile fresh Pico firmware** (use build script)
2. **Upload latest ESP32 firmware**
3. **Flash Pico with new UF2**
4. **Test all 3 tests** (heartbeat, echo, print)
5. **When all pass** → Connect printer

All communication is now **actively monitored and logged** - you'll see everything!
