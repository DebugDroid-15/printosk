#!/bin/bash
# Quick Pico Firmware Build Script for GitHub Codespaces

echo "🔧 Building Pico Firmware..."
cd /workspaces/printosk/firmware/pico_simple/build

# Clean previous build
rm -rf *

# Configure and build
echo "📋 Running CMake..."
cmake -DPICO_SDK_PATH=~/pico-sdk ..

echo "🔨 Compiling..."
make

# Verify output
echo ""
echo "✅ Build complete! Checking output..."
ls -lh *.uf2

echo ""
echo "📥 Download the UF2 file and upload to Pico via BOOTSEL"
echo "   File: /workspaces/printosk/firmware/pico_simple/build/pico_simple.uf2"
