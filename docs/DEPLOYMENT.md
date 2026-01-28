# Printosk Deployment & Setup Guide

Complete step-by-step guide for deploying the printer kiosk system.

## Part 1: Prerequisites

### Software Requirements
- Node.js 18+ (for Next.js frontend)
- Python 3.9+ (optional, for Supabase CLI)
- Git
- VS Code or similar editor

### Hardware Requirements
- **ESP32**: Espressif ESP32 DevKit (4MB flash, 520KB RAM)
- **Pico**: Raspberry Pi Pico (RP2040, 2MB flash, 264KB SRAM)
- **Keypad**: 4x4 numeric matrix keypad
- **Display**: SSD1306 128x64 OLED (I2C)
- **USB**: Network printer with USB interface
- **Power Supply**: 5V, adequate for ESP32, Pico, and accessories

### Cloud Services
- Supabase account (free tier sufficient for testing)
- Vercel account (free tier)
- Razorpay account (Indian payment processor)

---

## Part 2: Supabase Setup (Database & Storage)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in details:
   - Name: `printosk-prod` (or test)
   - Password: Generate strong password (save securely)
   - Region: Choose closest to your location
5. Click "Create new project" and wait 2-3 minutes

### Step 2: Create Database Schema

Once project is ready:

1. Go to SQL Editor
2. Click "New Query"
3. Copy entire contents of `backend/supabase/migrations/001_initial_schema.sql`
4. Paste into SQL editor
5. Click "Run" to execute
6. Should see 15+ tables created

### Step 3: Enable Row-Level Security (RLS)

1. Go to SQL Editor
2. Click "New Query"
3. Copy entire contents of `backend/supabase/policies/rls_policies.sql`
4. Paste and run
5. Verify all policies are created

### Step 4: Create Storage Bucket

1. Go to Storage (left sidebar)
2. Click "Create a new bucket"
3. Name: `print-files`
4. Make public: **NO** (keep private for security)
5. Click "Create bucket"

### Step 5: Configure Supabase Credentials

1. Go to Project Settings → API
2. Copy these values (save securely):
   - **Project URL** (SUPABASE_URL)
   - **Anon Key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY)

### Step 6: Enable pg_cron for Cleanup (Optional)

For automatic file cleanup after print:

1. Go to SQL Editor
2. Run:
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 2:00 AM
SELECT cron.schedule('cleanup-jobs', '0 2 * * *', 'SELECT cleanup_completed_jobs()');
```

---

## Part 3: Razorpay Setup

### Step 1: Create Razorpay Account

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up with business email
3. Verify email and phone
4. Complete KYC (identity verification)

### Step 2: Get API Keys

1. Go to Settings → API Keys
2. Copy these values:
   - **Test Key ID** (NEXT_PUBLIC_RAZORPAY_KEY)
   - **Test Key Secret** (RAZORPAY_SECRET)

### Step 3: Configure Webhook (Optional)

For production, set up webhook:

1. Go to Settings → Webhooks
2. Click "Add new webhook"
3. URL: `https://yourdomain.com/api/payments/webhook`
4. Select events: `payment.authorized`, `payment.failed`
5. Save

---

## Part 4: Frontend Deployment (Vercel)

### Step 1: Prepare Repository

```bash
cd Printosk/frontend

# Copy environment template
cp .env.example .env.local

# Edit with actual values
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_xxxxx
```

### Step 2: Deploy to Vercel

Option A: Via GitHub

1. Push `frontend/` to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select GitHub repository
5. Configure:
   - Framework: Next.js
   - Root Directory: `frontend`
6. Add environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_RAZORPAY_KEY
   - SUPABASE_SERVICE_ROLE_KEY
7. Click "Deploy"

Option B: Via Vercel CLI

```bash
npm install -g vercel

cd frontend/

# Install dependencies
npm install

# Deploy
vercel --prod
```

### Step 3: Verify Deployment

- Visit your Vercel domain
- Test file upload and payment flow
- Check browser console for errors

---

## Part 5: ESP32 Firmware Setup

### Prerequisites

- PlatformIO IDE (VSCode extension)
- USB cable for ESP32

### Step 1: Install PlatformIO

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search "PlatformIO IDE"
4. Install
5. Restart VS Code

### Step 2: Configure Hardware

Edit `firmware/esp32/src/config.h`:

```cpp
// WiFi
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// Supabase
#define SUPABASE_URL "https://your-project.supabase.co"
#define SUPABASE_API_KEY "your_anon_key"

// Hardware pins (adjust for your board)
#define KEYPAD_ROW_PINS { 14, 27, 26, 25 }
#define KEYPAD_COL_PINS { 18, 19, 21, 22 }
#define OLED_I2C_SDA 21
#define OLED_I2C_SCL 22
```

### Step 3: Connect ESP32

1. Plug ESP32 into computer via USB
2. PlatformIO should auto-detect
3. Open PlatformIO Serial Monitor (check COM port)

### Step 4: Build & Flash

```bash
cd firmware/esp32/

# Build
platformio run

# Upload to ESP32
platformio run --target upload

# Open serial monitor
platformio device monitor --baud 115200
```

### Step 5: Verify Initialization

Serial output should show:
```
========================================
Printosk ESP32 Firmware v1.0
Device ID: AA:BB:CC:DD:EE:FF
========================================

[INIT] Initializing display...
[INIT] Initializing keypad...
[INIT] Connecting to WiFi...
[INIT] WiFi connected!
...
[INIT] Setup complete!
```

### Step 6: Test Keypad & Display

1. Press numeric keys on keypad
2. Should appear in serial output: `[KEYPAD] Pressed: 1`
3. OLED display should show "Ready"

---

## Part 6: Pico Firmware Setup

### Prerequisites

- Pico SDK installed
- ARM GCC toolchain
- CMake 3.13+
- minicom or picocom (for monitoring)

### Step 1: Setup Pico SDK

Windows:
```bash
# Clone Pico SDK
cd C:\pico
git clone https://github.com/raspberrypi/pico-sdk.git
cd pico-sdk
git submodule update --init

# Set environment variable
setx PICO_SDK_PATH C:\pico\pico-sdk
```

Linux/Mac:
```bash
git clone https://github.com/raspberrypi/pico-sdk.git
export PICO_SDK_PATH=~/pico-sdk
echo 'export PICO_SDK_PATH=~/pico-sdk' >> ~/.bashrc
```

### Step 2: Build Pico Firmware

```bash
cd firmware/pico/

mkdir build
cd build

cmake ..
make -j4
```

Should produce `printosk_pico.uf2`

### Step 3: Flash Pico

1. Hold BOOTSEL button on Pico
2. Connect USB to computer (keep BOOTSEL held)
3. Release BOOTSEL when disk appears
4. Copy `build/printosk_pico.uf2` to Pico drive
5. Pico will reboot and run firmware

### Step 4: Monitor UART Output

```bash
# Linux/Mac
picocom -b 115200 /dev/ttyUSB0

# Windows (identify COM port first)
picocom -b 115200 COM3
```

Expected output:
```
Printosk Raspberry Pi Pico Firmware v1.0
========================================

[INIT] Initializing Pico hardware...
[INIT] UART initialized: 115200 baud
[INIT] Printer initialized
[INIT] Pico initialization complete

Waiting for print commands...
```

---

## Part 7: Hardware Assembly

### Wiring Diagram

```
ESP32                          Peripherals
┌─────────────────────┐
│                     │
│ GPIO14-GPIO17 ──────┼──→ Keypad Rows
│ GPIO18-GPIO21 ──────┼──→ Keypad Cols
│                     │
│ GPIO21 (SDA)────────┼──→ OLED SDA
│ GPIO22 (SCL)────────┼──→ OLED SCL
│                     │
│ GPIO17 (TX) ────────┼──→ Pico RX (GPIO1)
│ GPIO16 (RX) ────────┼──→ Pico TX (GPIO0)
│                     │
│ GND ────────────────┼──→ Ground (common)
│ 5V  ────────────────┼──→ +5V Power
└─────────────────────┘

Pico                           Printer
┌─────────────────────┐
│                     │
│ GPIO0 (RX) ─────────┼──→ ESP32 TX
│ GPIO1 (TX) ─────────┼──→ ESP32 RX
│                     │
│ USB ────────────────┼──→ Printer USB (Host)
│                     │
│ GND ────────────────┼──→ Ground (common)
│ VBUS────────────────┼──→ +5V Power
└─────────────────────┘
```

### Keypad Pinout

```
         Col0  Col1  Col2  Col3
Row0      1     2     3    Enter
Row1      4     5     6   Backspace
Row2      7     8     9     Up
Row3      *     0     #    Down
```

### OLED Pinout (SSD1306)

```
GND  ─── Ground
VCC  ─── +5V
SDA  ─── GPIO21 (I2C Data)
SCL  ─── GPIO22 (I2C Clock)
```

### USB Printer

```
Host (Pico USB) ─── Printer USB-B Cable ─── Printer
```

---

## Part 8: System Testing

### Test Checklist

#### Frontend
- [ ] Upload PDF file
- [ ] Select print settings (color, copies)
- [ ] Create Razorpay order
- [ ] Complete payment (test card: 4111111111111111, any future date, CVC: 123)
- [ ] Receive Print ID (6-digit number)

#### Supabase
- [ ] Verify job created in `print_jobs` table
- [ ] Verify file stored in Storage bucket
- [ ] Verify payment recorded in `payments` table
- [ ] Check RLS policies working (can't read other users' data)

#### ESP32
- [ ] WiFi connects automatically
- [ ] Keypad input detected (serial shows key presses)
- [ ] OLED displays status
- [ ] Can enter Print ID (6 digits)
- [ ] Fetches job from Supabase
- [ ] Displays print details on OLED

#### Pico
- [ ] Boots successfully
- [ ] Waits for UART commands
- [ ] Receives PRINT_COMMAND from ESP32
- [ ] Detects printer via USB
- [ ] Sends print job
- [ ] Reports status back to ESP32

#### End-to-End
1. Upload file on frontend
2. Pay via Razorpay
3. Enter Print ID at kiosk (ESP32)
4. Verify Pico receives print command
5. Verify file downloads and prints
6. Verify job status updates in Supabase
7. Verify files are deleted after 1+ hour

### Debug Mode

Enable debug logging:

**ESP32** (`firmware/esp32/src/config.h`):
```cpp
#define LOG_LEVEL_DEBUG 1
#define FEATURE_MOCK_KEYPAD 1        // Simulate key presses
#define FEATURE_MOCK_SUPABASE 1      // Mock API responses
#define FEATURE_DEBUG_DISPLAY 1      // Show debug info on OLED
```

**Pico** (`firmware/pico/src/config.h`):
```cpp
#define ENABLE_DEBUG_LOGS 1
#define FEATURE_MOCK_PRINTER 1       // Simulate printer
```

---

## Part 9: Production Checklist

Before going live:

### Security
- [ ] Change all default passwords
- [ ] Enable Razorpay live mode (not test)
- [ ] Configure HTTPS on all endpoints
- [ ] Review Supabase RLS policies
- [ ] Store API keys securely (use environment variables)
- [ ] Enable firewall rules
- [ ] Audit file permissions

### Performance
- [ ] Test with 100 concurrent users
- [ ] Verify database query performance
- [ ] Configure connection pooling
- [ ] Set up monitoring/alerting
- [ ] Enable CDN for static assets

### Operations
- [ ] Set up automated backups (Supabase)
- [ ] Configure log shipping (error tracking)
- [ ] Document recovery procedures
- [ ] Train staff on operation
- [ ] Create runbook for common issues

### Hardware
- [ ] Mount ESP32/Pico in weatherproof enclosure
- [ ] Connect to UPS for power continuity
- [ ] Label all cables
- [ ] Test hardware startup sequence
- [ ] Plan hardware maintenance schedule

---

## Part 10: Troubleshooting

### ESP32 Won't Connect to WiFi

**Issue**: ESP32 shows "WiFi disconnected" repeatedly

**Solution**:
1. Verify SSID and password in `config.h`
2. Check if WiFi is 2.4 GHz (5 GHz not supported)
3. Move ESP32 closer to router
4. Restart ESP32 (`platformio device monitor` → send `ER CHIP POWER`)

### Supabase API Errors

**Issue**: ESP32 gets 401 Unauthorized

**Solution**:
1. Verify API key in `config.h` is correct
2. Check if token is expired (Supabase tokens valid 1 hour)
3. Ensure project URL is correct
4. Check RLS policies allow access

### Pico Not Detected by USB

**Issue**: Printer not found on Pico

**Solution**:
1. Verify USB cable is good
2. Try different USB port
3. Check if printer is powered on
4. Verify printer supports USB printing

### Print Job Hangs

**Issue**: Job stuck in PRINTING state

**Solution**:
1. Check Pico serial output for errors
2. Verify printer is responsive
3. Check for paper jam or paper out
4. Restart Pico (disconnect/reconnect USB)

### File Cleanup Not Working

**Issue**: Files not deleted after 24 hours

**Solution**:
1. Verify pg_cron is enabled: `SELECT cron.check_progress('cleanup-jobs');`
2. Check cleanup_completed_jobs() function: `SELECT cleanup_completed_jobs();`
3. Verify file deletion_scheduled_at timestamp is set
4. Check Supabase storage permissions

---

## Part 11: Maintenance

### Weekly
- Check ESP32 logs for errors
- Verify Pico is responsive
- Test print job flow end-to-end
- Clear any jams or mechanical issues

### Monthly
- Review payment logs in Razorpay
- Check database size and optimize if needed
- Update firmware if patches available
- Audit storage usage

### Quarterly
- Full security review
- Performance optimization
- Backup and restore test
- Hardware inspection

---

## Support & Documentation

- **API Spec**: See `docs/API_SPECIFICATION.md`
- **UART Protocol**: See `docs/UART_PROTOCOL.md`
- **Database Schema**: See `docs/DATABASE_SCHEMA.md`
- **Security**: See `docs/SECURITY.md`

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-01-29 | Initial deployment guide |

