# Fresh Pico Firmware Build Instructions

## ✨ Why Fresh Build?

- Removes old cached files
- Ensures clean compilation
- Prevents build errors from leftover files
- Guarantees latest code is compiled

---

## 🚀 Method 1: Automatic Build Script (Recommended)

### On Windows

1. **Open GitHub Codespaces terminal**
2. Run this command:

```bash
cd /workspaces/printosk/firmware/pico_simple
bash build_firmware.sh
```

Or simply double-click: `build_firmware.bat` (Windows only)

**Expected output:**
```
==========================================
Printosk Pico Firmware Builder
==========================================

[1/4] Cleaning build directory...
✅ Build directory cleaned

[2/4] Running CMake configuration...
✅ CMake configuration complete

[3/4] Building firmware (this may take 1-2 minutes)...
✅ Firmware build complete

[4/4] Checking build output...
✅ pico_simple.uf2 ready (...)

==========================================
BUILD SUCCESSFUL!
==========================================
```

---

## 🚀 Method 2: Manual Build (Step-by-Step)

### In GitHub Codespaces

```bash
# Step 1: Navigate to build directory
cd /workspaces/printosk/firmware/pico_simple/build

# Step 2: Clean everything (start fresh)
rm -rf *

# Step 3: Run CMake to configure
cmake ..

# Step 4: Compile (using all CPU cores)
make -j4
```

**Wait for:**
```
[100%] Built target pico_simple
```

---

## 📥 Download the UF2 File

### From GitHub Codespaces

1. Left side panel → File Explorer
2. Navigate to: `firmware/pico_simple/build/`
3. Find **`pico_simple.uf2`** (usually ~700KB)
4. Right-click → **Download**
5. Save to your computer

---

## 🔌 Flash to Pico (Final Step)

### Windows

1. **Hold BOOTSEL button** on Pico board
2. **Connect USB** to computer (keep holding BOOTSEL!)
3. Hold for 2 more seconds, then **release**
4. **RPI-RP2 drive** should appear in File Explorer
5. **Drag `pico_simple.uf2`** into RPI-RP2 drive
6. Wait **10 seconds** for auto-reboot
7. RPI-RP2 drive disappears (normal)

### macOS/Linux

1. Hold BOOTSEL, connect USB
2. Drive named `RPI-RP2` appears
3. Copy file:
```bash
cp pico_simple.uf2 /Volumes/RPI-RP2/
```
4. Wait 10 seconds for reboot

---

## ✅ Verify Success

### Open Serial Monitor

1. Arduino IDE → **Tools → Serial Monitor**
2. Set **COM port** (your ESP32)
3. Set **Baud rate to 115200**
4. Look for:

```
[Pico] HEARTBEAT
[Pico] HEARTBEAT
[Pico] HEARTBEAT
```

✅ **See HEARTBEAT every 5 seconds?** → Success!  
❌ **Still no HEARTBEAT?** → Try flashing again

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `CMake command not found` | Make sure you're in GitHub Codespaces (CMake pre-installed) |
| `make: command not found` | Install build-essential: `sudo apt-get install build-essential` |
| Build fails with errors | Delete `/workspaces/printosk/firmware/pico_simple/build` and try again |
| RPI-RP2 drive not appearing | Use different USB port or USB cable |
| Still no HEARTBEAT after flash | Recompile using the build script, flash again |

---

## 📝 Build Files Location

After successful build, you'll find:

```
/workspaces/printosk/firmware/pico_simple/build/
├── pico_simple.uf2           ← Download this!
├── pico_simple.elf           (compiled binary)
├── pico_simple.hex           (hex format)
└── CMakeCache.txt
```

---

## 🎯 Quick Command (One-Liner)

**In GitHub Codespaces:**

```bash
cd /workspaces/printosk/firmware/pico_simple/build && rm -rf * && cmake .. && make -j4 && echo "✅ Build complete! Download pico_simple.uf2"
```

---

## 📊 Build Times

- Cleaning: **5 seconds**
- CMake: **10 seconds**
- Compilation: **30-60 seconds** (first time) / **5-10 seconds** (rebuilds)
- **Total: ~1-2 minutes**

---

## ✨ Latest Code Features

The firmware includes:

- ✅ Heartbeat every 5 seconds
- ✅ Echo test responder (TEST_ECHO)
- ✅ 9-step print command processing
- ✅ LED feedback on command reception
- ✅ Dual UART support (ESP32 + Printer)
- ✅ ESC/POS printer commands

---

## 🔄 After Flashing

1. **Serial Monitor** should show HEARTBEAT every 5 seconds
2. Run **Test 2**: Press 0→0→0 for echo test
3. Run **Test 3**: Enter Print ID for full command test
4. When all tests pass → **Connect printer and start printing!**

---

## 💾 Keep UF2 File Safe

After downloading `pico_simple.uf2`, keep it saved somewhere safe. If you need to reflash later, you won't need to recompile - just use the same UF2 file.

To reflash without rebuilding:
1. Hold BOOTSEL
2. Connect USB
3. Drag saved `pico_simple.uf2` to RPI-RP2

---

**Build script committed to GitHub: commit 6f10fe4**
