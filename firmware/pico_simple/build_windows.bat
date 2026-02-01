@echo off
REM Printosk Pico Firmware Builder for Windows
REM Downloads pre-built tools and compiles firmware

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set BUILD_DIR=%SCRIPT_DIR%build
set SDK_PATH=C:\pico\pico-sdk

echo.
echo ==========================================
echo Printosk Pico Firmware Builder (Windows)
echo ==========================================
echo.

REM Check if SDK exists
if not exist "%SDK_PATH%" (
    echo ERROR: Pico SDK not found at %SDK_PATH%
    echo Please install the SDK first:
    echo   git clone https://github.com/raspberrypi/pico-sdk.git C:\pico\pico-sdk
    exit /b 1
)

REM Check if cmake exists
where cmake >nul 2>&1
if errorlevel 1 (
    echo ERROR: CMake not found. Please install CMake and add to PATH
    exit /b 1
)

REM Check if ARM compiler exists
where arm-none-eabi-gcc >nul 2>&1
if errorlevel 1 (
    echo ERROR: ARM GCC not found. Please install ARM GNU Toolchain and add to PATH
    exit /b 1
)

REM Check if make exists
where make >nul 2>&1
if errorlevel 1 (
    echo ERROR: GNU Make not found. Install with: winget install GnuWin32.Make
    exit /b 1
)

echo [OK] All tools found
echo.

REM Clean build directory
echo [1/3] Cleaning build directory...
if exist "%BUILD_DIR%" (
    rmdir /s /q "%BUILD_DIR%"
)
mkdir "%BUILD_DIR%"
cd /d "%BUILD_DIR%"

REM Configure with CMake
echo [2/3] Configuring with CMake...
setlocal
set PICO_SDK_PATH=%SDK_PATH%
set CC=arm-none-eabi-gcc
set CXX=arm-none-eabi-g++
cmake -DCMAKE_BUILD_TYPE=Release -G "Unix Makefiles" -DPICO_SDK_PATH=%SDK_PATH% -DCMAKE_C_COMPILER=arm-none-eabi-gcc -DCMAKE_CXX_COMPILER=arm-none-eabi-g++ .. || (
    echo ERROR: CMake configuration failed
    exit /b 1
)
endlocal

REM Build
echo [3/3] Building firmware...
make -j4 || (
    echo ERROR: Build failed
    exit /b 1
)

REM Check output
echo.
if exist "pico_simple.uf2" (
    echo SUCCESS! Firmware built:
    for /F "usebackq" %%A in (`powershell -Command "'{0:N2}' -f ((Get-Item 'pico_simple.uf2').Length / 1KB)"`) do (
        echo   pico_simple.uf2 (%%A KB)
    )
    echo.
    echo Next steps:
    echo   1. Hold BOOTSEL button on Pico
    echo   2. Connect USB cable while holding BOOTSEL
    echo   3. Release after 2 seconds
    echo   4. Drag pico_simple.uf2 to RPI-RP2 drive
    echo   5. Device will auto-reboot
) else (
    echo ERROR: UF2 file not generated
    exit /b 1
)

echo.
echo Build complete!
