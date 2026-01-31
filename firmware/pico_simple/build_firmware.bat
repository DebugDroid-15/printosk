@echo off
REM Printosk Pico Firmware Build Script (Windows)
REM Cleans and builds fresh firmware for optimal results

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Printosk Pico Firmware Builder
echo ==========================================
echo.

REM Set paths
set SCRIPT_DIR=%~dp0
set BUILD_DIR=%SCRIPT_DIR%build

echo [1/4] Cleaning build directory...
if exist "%BUILD_DIR%" (
    cd /d "%BUILD_DIR%"
    for /d %%D in (*) do rmdir /s /q "%%D"
    del /q /s * 2>nul
    echo ✅ Build directory cleaned
) else (
    mkdir "%BUILD_DIR%"
    echo ✅ Build directory created
)
echo.

echo [2/4] Running CMake configuration...
cd /d "%BUILD_DIR%"
cmake .. >nul 2>&1
if errorlevel 1 (
    echo ❌ CMake failed!
    exit /b 1
)
echo ✅ CMake configuration complete
echo.

echo [3/4] Building firmware (this may take 1-2 minutes)...
make -j4
if errorlevel 1 (
    echo ❌ Build failed!
    exit /b 1
)
echo ✅ Firmware build complete
echo.

echo [4/4] Checking build output...
if exist "%BUILD_DIR%\pico_simple.uf2" (
    for /F "usebackq" %%A in (`powershell -Command "(Get-Item '%BUILD_DIR%\pico_simple.uf2').Length / 1MB | {[Math]::Round($_,2)}"`) do (
        set SIZE=%%A
    )
    echo ✅ pico_simple.uf2 ready (!SIZE! MB)
    echo.
    echo ==========================================
    echo BUILD SUCCESSFUL!
    echo ==========================================
    echo.
    echo 📁 Location: %BUILD_DIR%\pico_simple.uf2
    echo.
    echo Next steps:
    echo 1. Hold BOOTSEL button on Pico
    echo 2. Plug USB into computer (keep holding BOOTSEL)
    echo 3. Release BOOTSEL after 2 seconds
    echo 4. Drag pico_simple.uf2 to RPI-RP2 drive
    echo 5. Wait 10 seconds for reboot
    echo.
    pause
) else (
    echo ❌ Build failed - pico_simple.uf2 not found!
    exit /b 1
)
