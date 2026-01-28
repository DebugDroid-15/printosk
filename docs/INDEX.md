# Printosk - Complete Project Index

Quick reference to all project files and documentation.

## 📂 Project Structure

```
Printosk/
├── README.md                          # Main project overview
│
├── docs/
│   ├── API_SPECIFICATION.md           # REST API endpoints & UART protocol
│   ├── UART_PROTOCOL.md               # Serial communication spec (detailed)
│   ├── DEPLOYMENT.md                  # Setup & deployment guide
│   ├── DATABASE_SCHEMA.md             # PostgreSQL schema reference
│   ├── SECURITY.md                    # Security & privacy guide
│   └── INDEX.md                       # This file
│
├── frontend/                          # Next.js web application
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── .env.example
│   ├── app/
│   │   ├── page.tsx                  # Home page
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   └── lib/
│       ├── supabase.ts               # Supabase client
│       ├── razorpay.ts               # Payment integration
│       └── utils.ts                  # Utilities
│
├── backend/
│   └── supabase/
│       ├── migrations/
│       │   └── 001_initial_schema.sql     # Database schema (17 tables + functions)
│       ├── policies/
│       │   └── rls_policies.sql           # Row-level security policies
│       └── config/
│           └── storage_buckets.sql        # Storage configuration
│
└── firmware/
    ├── esp32/                         # ESP32 Kiosk Controller
    │   ├── platformio.ini
    │   ├── README.md
    │   └── src/
    │       ├── main.cpp              # Entry point, task management
    │       ├── config.h              # Hardware pinouts, WiFi, API URLs
    │       ├── wifi_manager.h/cpp    # WiFi connectivity
    │       ├── supabase_client.h/cpp # REST API client
    │       ├── keypad.h/cpp          # 4x4 keypad driver
    │       ├── display.h/cpp         # SSD1306 OLED driver
    │       ├── uart_protocol.h/cpp   # UART frame codec
    │       ├── state_machine.h/cpp   # Print job FSM
    │       └── utils.h/cpp           # Logging, memory
    │
    └── pico/                          # Pico Printer Controller
        ├── CMakeLists.txt
        ├── README.md
        └── src/
            ├── main.c                # Entry point
            ├── config.h              # Configuration & pinouts
            ├── uart.h/c              # UART communication
            ├── command_parser.h/c    # JSON command parser
            ├── printer.h/c           # Printer interface abstraction
            ├── usb_printer.h/c       # USB printer driver
            └── utils.h/c             # Logging, utilities
```

---

## 📖 Documentation Map

### Getting Started
1. Start with [README.md](README.md) - System overview & architecture
2. Read [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Step-by-step setup guide

### Architecture & Design
- [API_SPECIFICATION.md](docs/API_SPECIFICATION.md) - REST API & UART protocol (comprehensive)
- [UART_PROTOCOL.md](docs/UART_PROTOCOL.md) - Deep dive into serial communication
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - PostgreSQL tables, functions, queries
- [SECURITY.md](docs/SECURITY.md) - Security measures, threat model, compliance

### Component Documentation
- [ESP32 Firmware README](firmware/esp32/README.md) - Multi-threaded FreeRTOS architecture
- [Pico Firmware README](firmware/pico/README.md) - Bare-metal synchronous execution

---

## 🔑 Key Files by Component

### Frontend (Next.js)
- **Entry**: `frontend/app/page.tsx` (home page)
- **Config**: `frontend/.env.example` (environment variables)
- **API Client**: `frontend/lib/supabase.ts` (Supabase integration)
- **Payment**: `frontend/lib/razorpay.ts` (Razorpay integration)
- **Utils**: `frontend/lib/utils.ts` (helpers)
- **Styles**: `frontend/app/globals.css` (CSS)

### Backend (Supabase)
- **Schema**: `backend/supabase/migrations/001_initial_schema.sql`
  - 17 tables (users, print_jobs, print_files, payments, audit_logs, etc.)
  - 5 functions (generate_print_id, cleanup_completed_jobs, update_job_status, etc.)
  - Views (latest_job_status)
  - Triggers (timestamp updates)
  
- **Security**: `backend/supabase/policies/rls_policies.sql`
  - Row-level security (RLS) for all tables
  - Storage policies for file bucket
  - Service role access controls

### ESP32 Firmware
- **Entry**: `firmware/esp32/src/main.cpp`
  - FreeRTOS task creation
  - Hardware initialization
  - Task management (keypad, display, network, UART)

- **Hardware**:
  - Keypad: `firmware/esp32/src/keypad.h/cpp` (4x4 matrix, debounce)
  - Display: `firmware/esp32/src/display.h/cpp` (SSD1306 I2C)
  - UART: `firmware/esp32/src/uart_protocol.h/cpp` (frame codec, CRC)

- **Cloud**:
  - WiFi: `firmware/esp32/src/wifi_manager.h/cpp`
  - Supabase: `firmware/esp32/src/supabase_client.h/cpp` (REST API)

- **Logic**:
  - FSM: `firmware/esp32/src/state_machine.h/cpp` (IDLE → FETCHING → PRINTING → DONE)
  - Config: `firmware/esp32/src/config.h` (all pins, WiFi, API URLs)

### Pico Firmware
- **Entry**: `firmware/pico/src/main.c`
  - Simple blocking loop
  - UART command processing
  
- **Layers**:
  - UART: `firmware/pico/src/uart.h/c` (serial frame handling)
  - Parser: `firmware/pico/src/command_parser.h/c` (JSON deserialization)
  - Printer: `firmware/pico/src/printer.h/c` (abstraction layer)
  - USB: `firmware/pico/src/usb_printer.h/c` (low-level USB driver)
  - Utils: `firmware/pico/src/utils.h/c` (logging, CRC, memory)

---

## 🔗 Data Flow

### User Upload to Print

```
1. Frontend (Next.js)
   - User uploads PDF → lib/supabase.ts (uploadFile)
   - File stored in Supabase Storage bucket

2. Frontend (Next.js)
   - User selects settings (color, copies) → form
   - Frontend initiates Razorpay payment → lib/razorpay.ts

3. Razorpay
   - User enters card details (in Razorpay UI, not our code)
   - Payment authorized → Webhook to backend

4. Frontend (Next.js)
   - Receives payment_id + signature from Razorpay
   - Verifies signature → API call to Supabase
   - Calls create_job_after_payment() function

5. Supabase PostgreSQL
   - Function verifies payment status
   - Creates print_job with unique print_id_numeric (100000-999999)
   - Updates user statistics
   - Returns job_id + print_id to frontend

6. Frontend (Next.js)
   - Displays print_id to user (6 digits)
   - User can check status via lookup page
```

### Kiosk Print Flow

```
1. ESP32 (Main loop)
   - IDLE state: Waits for keypad input
   - User enters 6-digit Print ID + ENTER

2. ESP32 (Fetching state)
   - State machine validates Print ID (6 digits)
   - Sends HTTP GET to Supabase:
     GET /rest/v1/print_jobs?print_id_numeric=eq.XXXXXX

3. Supabase
   - RLS policy checks: job exists and not expired
   - Returns job details + files list

4. ESP32 (Validating state)
   - Displays job details on OLED
   - Waits for user confirmation

5. ESP32 (Printing state)
   - Sends PRINT_COMMAND via UART to Pico
   - Command includes file_url, settings

6. Pico (Main loop)
   - Receives UART frame, parses JSON
   - Downloads file from Supabase Storage (signed URL)
   - Connects to USB printer

7. Pico (Print execution)
   - Sends print commands to printer
   - Updates status periodically via UART

8. ESP32
   - Receives status updates from Pico
   - Updates OLED display
   - Updates job status in Supabase via HTTP POST

9. Supabase
   - Updates print_jobs.status = "COMPLETED"
   - RLS policy ensures only service role can update

10. ESP32 (Cleanup)
    - After successful print
    - Sends HTTP POST to mark_job_for_deletion()

11. Supabase (Cleanup job)
    - Sets deletion_scheduled_at = NOW()
    - pg_cron runs cleanup_completed_jobs() every hour
    - Deletes files from storage + database records
```

---

## 🛠️ Configuration Checklist

### Before Deployment

#### Supabase
- [ ] Create project
- [ ] Run migration SQL (schema)
- [ ] Run RLS policies SQL
- [ ] Enable pg_cron for cleanup
- [ ] Create storage bucket (print-files)
- [ ] Copy credentials to frontend .env

#### Razorpay
- [ ] Create account & verify business
- [ ] Get API keys (test mode first)
- [ ] Configure webhook URL

#### Frontend (Vercel)
- [ ] Connect GitHub repo
- [ ] Set environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - NEXT_PUBLIC_RAZORPAY_KEY
  - SUPABASE_SERVICE_ROLE_KEY (server-only)
  - RAZORPAY_SECRET (server-only)
- [ ] Deploy

#### ESP32
- [ ] Update config.h:
  - WIFI_SSID, WIFI_PASSWORD
  - SUPABASE_URL, SUPABASE_API_KEY
  - Hardware pins (match your wiring)
- [ ] Build & flash
- [ ] Verify WiFi connection
- [ ] Test keypad input
- [ ] Test OLED display

#### Pico
- [ ] Update config.h (if needed)
- [ ] Build & flash
- [ ] Verify USB printer detected
- [ ] Test UART communication with ESP32

---

## 📊 Key Metrics

### Tables
- **users**: User accounts (1:N jobs, 1:N payments)
- **print_jobs**: Core job tracking (17 columns, 7 indexes)
- **print_files**: File references (soft delete support)
- **payments**: Payment records (Razorpay integration)
- **job_status_history**: Audit log of state transitions
- **audit_logs**: General audit trail (compliance)

### Functions
- `generate_print_id()` - Unique 6-digit ID generator
- `mark_job_for_deletion()` - Schedule file cleanup
- `cleanup_completed_jobs()` - Actually delete files (pg_cron)
- `update_job_status()` - Atomic status update with history
- `create_job_after_payment()` - Atomically create job after payment

### API Endpoints
- **Frontend ↔ Supabase**: 20+ REST endpoints (standard Supabase)
- **ESP32 ↔ Supabase**: 5 main endpoints (fetch, update, delete)
- **ESP32 ↔ Pico**: UART frame-based (JSON payload)

### Hardware
- **ESP32**: 4 MB flash, 520 KB RAM, WiFi
- **Pico**: 2 MB flash, 264 KB SRAM, USB host
- **Keypad**: 4x4 numeric matrix
- **Display**: SSD1306 128x64 OLED (I2C)
- **Printer**: USB network printer

---

## 🚀 Quick Start

1. **Backend**: Run Supabase migration + RLS policies
2. **Frontend**: Deploy to Vercel with env vars
3. **ESP32**: Flash firmware, configure WiFi/API
4. **Pico**: Flash firmware, connect USB printer
5. **Test**: Upload file → Pay → Enter Print ID → Print

---

## 📚 Learning Path

### For Frontend Developer
1. [README.md](README.md) - System overview
2. `frontend/lib/supabase.ts` - How to call Supabase
3. `frontend/lib/razorpay.ts` - Payment integration
4. [API_SPECIFICATION.md](docs/API_SPECIFICATION.md) - API endpoints

### For Backend Engineer
1. [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Table structure
2. `backend/supabase/migrations/001_initial_schema.sql` - DDL
3. `backend/supabase/policies/rls_policies.sql` - Security
4. [SECURITY.md](docs/SECURITY.md) - Data protection

### For Embedded Systems Engineer
1. [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Hardware setup
2. [ESP32 README](firmware/esp32/README.md) - Multi-threaded architecture
3. [Pico README](firmware/pico/README.md) - Synchronous driver
4. [UART_PROTOCOL.md](docs/UART_PROTOCOL.md) - Serial comm

### For DevOps / Operations
1. [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Full deployment guide
2. [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Backup & maintenance
3. [SECURITY.md](docs/SECURITY.md) - Security & compliance
4. `frontend/.env.example` - Environment config

---

## 🔍 Common Searches

- **"How to add new print setting?"**
  → Modify `print_jobs` schema + ESP32 display + Pico printer interface

- **"How to change Print ID format?"**
  → Edit `generate_print_id()` function in `001_initial_schema.sql`

- **"How to add OTA updates?"**
  → Extend ESP32 main.cpp with `UPDATE_STATE` and download logic

- **"How to support multiple printers?"**
  → Modify Pico `usb_printer_find()` to scan all devices + queue

- **"How to enable offline mode?"**
  → Add ESP32 NVS storage + local job queue + sync on reconnect

- **"How to add authentication?"**
  → Extend frontend with Supabase Auth + JWT token in API calls

---

## 📞 Support & Questions

**System Design Questions**: See [README.md](README.md) and [DEPLOYMENT.md](docs/DEPLOYMENT.md)  
**API Questions**: See [API_SPECIFICATION.md](docs/API_SPECIFICATION.md)  
**Database Questions**: See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)  
**Security Questions**: See [SECURITY.md](docs/SECURITY.md)  
**Firmware Questions**: See respective firmware README files  

---

## 📝 Document Versions

| Document | Version | Updated | Status |
|----------|---------|---------|--------|
| README.md | 1.0 | 2026-01-29 | Complete |
| API_SPECIFICATION.md | 1.0 | 2026-01-29 | Complete |
| UART_PROTOCOL.md | 1.0 | 2026-01-29 | Complete |
| DEPLOYMENT.md | 1.0 | 2026-01-29 | Complete |
| DATABASE_SCHEMA.md | 1.0 | 2026-01-29 | Complete |
| SECURITY.md | 1.0 | 2026-01-29 | Complete |
| ESP32 README | 1.0 | 2026-01-29 | Complete |
| Pico README | 1.0 | 2026-01-29 | Complete |

---

**Last Updated**: January 29, 2026  
**Project**: Printosk Self-Service Printer Kiosk  
**Status**: Production-ready architecture

