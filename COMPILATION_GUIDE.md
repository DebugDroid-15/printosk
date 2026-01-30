# Pre-Compiled Pico Firmware - EPSON L3115 Printer Support

## Quick Start - NO COMPILATION NEEDED

If you don't want to compile, you can use the pre-built UF2 files:

### Option 1: Use Wokwi Online Compiler (Easiest)

1. Go to: https://wokwi.com
2. Create new Pico project
3. Replace `pico_simple.c` with content from: `firmware/pico_simple/pico_simple.c`
4. Click "Build" → Wait for compile
5. Download the `.uf2` file
6. Flash to your Pico (hold BOOTSEL, drag UF2 file)

### Option 2: GitHub Codespaces (Recommended for reliability)

Since you're having issues with local compilation, use GitHub Codespaces:

1. Go to: https://github.com/DebugDroid-15/printosk
2. Click **Code** → **Codespaces** → **Create codespace on main**
3. Wait for it to load (this opens a full Linux environment in browser)
4. In the **bottom terminal**, run:
   ```bash
   cd firmware/pico_simple
   mkdir -p build && cd build
   cmake ..
   make -j4
   ```
5. Download `pico_simple.uf2` from the file explorer
6. Flash to Pico

### Option 3: Use GitHub Actions (Automated Build)

We can set up GitHub Actions to automatically compile when you push code.

---

## If You Want to Compile Locally (Windows)

You need:
- ARM GCC Compiler (`arm-none-eabi-gcc`)
- CMake 3.13+
- Pico SDK

This is complex to set up on Windows. **Codespaces is much easier.**

---

## IMMEDIATE ACTION

**Follow Option 2 (Codespaces)** - it's the fastest way to get working firmware.

Once you have the UF2 file:

1. Plug Pico into USB with BOOTSEL held
2. A drive called "RPI-RP2" appears
3. Drag `pico_simple.uf2` onto it
4. Wait 10 seconds, Pico reboots with new firmware

---

## Testing the New Firmware

After flashing:

1. Open serial monitor on Pico (9600 baud or 115200 - try both)
2. You should see:
   ```
   PICO_INITIALIZED
   WAITING_FOR_ESP32
   ```

3. From ESP32 kiosk: Enter Print ID 837032 and press ENTER
4. Serial output should show:
   ```
   [Pico] Received: START_PRINT:837032:1
   [Pico] DEBUG: Parsing command...
   [Pico] DEBUG: Initializing printer...
   [Pico] DEBUG: Printing PRINTOSK header...
   ...
   [Pico] Print job completed
   ```

5. **Printer should output receipt!**

---

## Troubleshooting If Printer Still Silent

See: `PRINTER_TROUBLESHOOTING.md` in repo root

Key checks:
- ☑ Printer powered on?
- ☑ GPIO 0/1 connected via 22Ω resistors to printer D+/D-?
- ☑ Common ground between Pico and printer?
- ☑ Try changing `PRINTER_BAUD_RATE` from 115200 to 9600?

