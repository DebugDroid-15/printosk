#!/bin/bash
# Pico Printer Firmware Compilation Script
# Run this in GitHub Codespaces to compile the firmware

set -e

echo "=== Pico Printer Integration Compiler ==="
echo "Compiling firmware with EPSON L3115 printer support..."
echo ""

# Install dependencies (if needed)
if ! command -v arm-none-eabi-gcc &> /dev/null; then
    echo "[*] Installing ARM GCC toolchain..."
    sudo apt-get update
    sudo apt-get install -y build-essential cmake gcc-arm-none-eabi libnewlib-arm-none-eabi libstdc++-arm-none-eabi-newlib
fi

# Navigate to build directory
cd firmware/pico_simple
mkdir -p build
cd build

# Configure CMake with Pico SDK
echo "[*] Configuring CMake..."
cmake .. -DPICO_BOARD=pico -DCMAKE_BUILD_TYPE=Release

# Build firmware
echo "[*] Building firmware..."
make -j4

# Check output
if [ -f "pico_simple.uf2" ]; then
    echo ""
    echo "=== BUILD SUCCESSFUL ==="
    echo "Output file: $(pwd)/pico_simple.uf2"
    echo "File size: $(stat -f%z pico_simple.uf2 2>/dev/null || stat -c%s pico_simple.uf2) bytes"
    echo ""
    echo "Next steps:"
    echo "1. Hold BOOTSEL button on Pico"
    echo "2. Plug Pico into USB"
    echo "3. Copy pico_simple.uf2 to RPI-RP2 drive"
    echo "4. Pico will auto-reboot"
else
    echo ""
    echo "=== BUILD FAILED ==="
    echo "Check errors above"
    exit 1
fi
