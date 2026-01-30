# Pico Firmware Recompilation Guide

## Quick Steps (GitHub Codespaces)

The Pico firmware UART pins have been updated from GPIO 8/9 to GPIO 0/1 (UART0).

### Method 1: Recompile in Codespaces (2 minutes)

1. Open GitHub Codespaces for this repo
2. Run in terminal:
```bash
cd firmware/pico_simple/build
rm -rf *
cmake -DPICO_SDK_PATH=~/pico-sdk ..
make
ls -la *.uf2
```

3. Download the new `pico_simple.uf2` file
4. Upload to Pico via BOOTSEL (same as before)

### Method 2: Use Pre-built Binary (If Available)

Wait for automatic GitHub Actions build, or check releases.

## Physical Connection (Verified)

- **Pico GPIO 0 (RX)** → ESP32 GPIO 16 (RX pin, via 22Ω resistor)
- **Pico GPIO 1 (TX)** → ESP32 GPIO 17 (TX pin)
- **Pico GND** → ESP32 GND (common ground)

## Expected Serial Output After Recompilation

```
[Serial] Pico communication initialized
[SYSTEM] Setup Complete!
PICO_INITIALIZED          ← Should see this from Pico
WAITING_FOR_ESP32         ← Should see this from Pico
ESP_READY                 ← ESP32 sends this
PICO_READY                ← Pico responds with this
```

If you see all above messages → **System communication working! ✅**

## Troubleshooting

**If still no Pico response:**
1. Check physical USB cable between ESP32 and Pico
2. Verify GPIO 0/1 are soldered correctly
3. Check for continuity between pins with multimeter

