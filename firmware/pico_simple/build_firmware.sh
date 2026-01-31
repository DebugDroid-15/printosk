#!/bin/bash
# Printosk Pico Firmware Build Script
# Cleans and builds fresh firmware for optimal results

echo "=========================================="
echo "Printosk Pico Firmware Builder"
echo "=========================================="
echo ""

# Navigate to build directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"

echo "[1/4] Cleaning build directory..."
rm -rf "$BUILD_DIR"/*
echo "✅ Build directory cleaned"
echo ""

echo "[2/4] Running CMake configuration..."
cd "$BUILD_DIR"
cmake .. 2>&1 | tail -5
if [ $? -ne 0 ]; then
    echo "❌ CMake failed!"
    exit 1
fi
echo "✅ CMake configuration complete"
echo ""

echo "[3/4] Building firmware (this may take 1-2 minutes)..."
make -j4
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Firmware build complete"
echo ""

echo "[4/4] Checking build output..."
if [ -f "$BUILD_DIR/pico_simple.uf2" ]; then
    UF2_SIZE=$(ls -lh "$BUILD_DIR/pico_simple.uf2" | awk '{print $5}')
    echo "✅ pico_simple.uf2 ready ($UF2_SIZE)"
    echo ""
    echo "=========================================="
    echo "BUILD SUCCESSFUL!"
    echo "=========================================="
    echo ""
    echo "📁 Location: $BUILD_DIR/pico_simple.uf2"
    echo ""
    echo "Next steps:"
    echo "1. Hold BOOTSEL button on Pico"
    echo "2. Plug USB into computer (keep holding BOOTSEL)"
    echo "3. Release BOOTSEL after 2 seconds"
    echo "4. Drag pico_simple.uf2 to RPI-RP2 drive"
    echo "5. Wait 10 seconds for reboot"
    echo ""
else
    echo "❌ Build failed - pico_simple.uf2 not found!"
    exit 1
fi
