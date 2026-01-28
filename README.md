# Printosk - Self-Service Printer Kiosk System

A complete end-to-end solution for a paid self-service printer kiosk with web frontend, cloud backend, and embedded systems.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     WEB APPLICATION (Vercel)                    │
│  Next.js: File Upload → Settings → Razorpay Payment → Print ID │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CLOUD BACKEND (Supabase PostgreSQL)                │
│  • Storage: Print files, payment receipts                       │
│  • Database: Users, Jobs, Files, Payments, Audit logs          │
│  • Auth: Row-level security, API policies                       │
│  • Secure deletion after successful print                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    KIOSK HARDWARE (Local)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ESP32 (WiFi Coordinator & State Manager)                │  │
│  │ • Keypad input (0-9, Enter, Back)                       │  │
│  │ • OLED display (SSD1306, I2C)                           │  │
│  │ • Supabase API communication (REST)                     │  │
│  │ • UART to Pico controller                               │  │
│  │ • Finite state machine (IDLE → FETCHING → PRINTING)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│              UART ↕ (Protocol-based communication)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Raspberry Pi Pico (Printer Driver & USB Handler)        │  │
│  │ • UART command parser (JSON/binary protocol)            │  │
│  │ • USB printer communication (libusb abstraction)        │  │
│  │ • Print job execution & status tracking                 │  │
│  │ • Deterministic, synchronous execution                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│              USB ↓                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Network Printer (via USB)                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
Printosk/
├── README.md (this file)
├── docs/
│   ├── API_SPECIFICATION.md       # REST API endpoints & payloads
│   ├── UART_PROTOCOL.md           # ESP32-Pico communication spec
│   ├── DEPLOYMENT.md              # Setup & deployment guide
│   ├── DATABASE_SCHEMA.md          # Detailed schema documentation
│   └── SECURITY.md                # Security & encryption notes
│
├── frontend/                      # Next.js web application
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── upload/
│   │   │   └── page.tsx          # File upload page
│   │   ├── payment/
│   │   │   └── page.tsx          # Payment processing
│   │   ├── confirmation/
│   │   │   └── page.tsx          # Print ID display
│   │   └── layout.tsx
│   ├── components/               # Reusable React components
│   ├── lib/
│   │   ├── api.ts               # API client wrapper
│   │   ├── razorpay.ts          # Payment integration
│   │   └── utils.ts             # Helper functions
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── backend/
│   └── supabase/
│       ├── migrations/
│       │   └── 001_initial_schema.sql  # Database schema
│       ├── policies/
│       │   └── rls_policies.sql        # Row-level security
│       ├── functions/
│       │   ├── delete_completed_job.sql
│       │   ├── generate_print_id.sql
│       │   └── update_job_status.sql
│       └── config/
│           └── storage_buckets.sql
│
├── firmware/
│   ├── esp32/
│   │   ├── src/
│   │   │   ├── main.cpp              # Entry point
│   │   │   ├── config.h              # Configuration constants
│   │   │   │
│   │   │   ├── wifi_manager.h/cpp    # WiFi initialization
│   │   │   ├── supabase_client.h/cpp # Supabase REST client
│   │   │   │
│   │   │   ├── keypad.h/cpp          # Numeric keypad driver
│   │   │   ├── display.h/cpp         # OLED SSD1306 driver
│   │   │   │
│   │   │   ├── uart_protocol.h/cpp   # UART codec & parser
│   │   │   ├── state_machine.h/cpp   # FSM: IDLE, FETCHING, PRINTING
│   │   │   │
│   │   │   └── utils.h/cpp           # Logging, memory, helpers
│   │   │
│   │   ├── platformio.ini            # PlatformIO configuration
│   │   └── README.md
│   │
│   └── pico/
│       ├── src/
│       │   ├── main.c                # Entry point
│       │   ├── config.h              # Configuration & pinouts
│       │   │
│       │   ├── uart.h/c              # UART communication layer
│       │   ├── command_parser.h/c    # Parse commands from ESP32
│       │   │
│       │   ├── printer.h/c           # Printer interface abstraction
│       │   ├── usb_printer.h/c       # USB printer driver
│       │   │
│       │   └── utils.h/c             # Logging, memory helpers
│       │
│       ├── CMakeLists.txt            # CMake build configuration
│       └── README.md
│
└── docs/
    └── DEPLOYMENT.md
```

## Key Features

### Frontend (Next.js)
- File upload with drag-and-drop
- Print settings form (color, B&W, copies, paper size)
- Razorpay payment integration
- Print ID generation and display
- Status tracking via Print ID lookup
- Responsive design for desktop and mobile

### Backend (Supabase)
- PostgreSQL database with strict schema
- Row-level security (RLS) policies
- Secure file storage with automatic deletion
- Encrypted payment data
- Audit logs for compliance
- REST API for frontend & firmware

### ESP32 Firmware
- WiFi connectivity with auto-reconnect
- Supabase REST API integration
- Numeric keypad input handling (4x4 matrix or direct)
- OLED SSD1306 display driver (I2C)
- Finite state machine for job lifecycle
- UART protocol handler for Pico communication
- Error handling and retry logic
- Memory-efficient async operations

### Pico Firmware
- UART command parser (JSON protocol)
- USB printer communication via libusb abstraction
- Deterministic synchronous print job execution
- Status reporting (STARTED, PRINTING, DONE, ERROR)
- Robust error handling
- Mock mode for testing without printer

## Hardware Requirements

### ESP32
- Espressif ESP32 DevKit
- 4 MB flash, 520 KB RAM
- GPIO pins for keypad, I2C (OLED), UART (Pico)
- WiFi capability (built-in)

### Raspberry Pi Pico
- RP2040 microcontroller
- 2 MB flash, 264 KB SRAM
- USB 2.0 host for printer communication
- UART pins for ESP32

### Peripherals
- **Keypad**: 4x4 numeric matrix or 16-key pad (rows on GPIO 14-17, cols on GPIO 18-21)
- **OLED Display**: SSD1306 128x64 (I2C: SDA=GPIO21, SCL=GPIO22)
- **Printer**: USB network printer (compatible with CUPS/standard drivers)
- **Power Supply**: 5V for ESP32 & Pico, adequate for all peripherals

## Communication Protocols

### Web → Supabase
Standard RESTful JSON API over HTTPS.

### Supabase → Kiosk (ESP32)
REST API (HTTPS), polling or webhooks.

### ESP32 ↔ Pico
Serial UART (115200 baud, 8N1):
```
Command:   {type:"PRINT", id:"ABC123", color:true, copies:2, file_url:"..."}
Response:  {status:"STARTED"}|{status:"PRINTING",progress:50}|{status:"DONE"} or {error:"..."}
```

## Setup Instructions

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete setup guide covering:
- Supabase project creation & configuration
- Vercel frontend deployment
- ESP32 firmware flashing
- Pico firmware flashing
- Local testing with mock modes

## Security Considerations

- **API Keys**: Environment variables, never hardcoded
- **File Deletion**: Automatic after successful print + timed cleanup
- **RLS Policies**: Strict access control in Supabase
- **UART**: Local only, no encryption needed (physical security)
- **Payment Data**: Never stored locally, handled via Razorpay
- **OLED**: No sensitive data displayed after job complete

## Development & Testing

### Mock Modes
All components support mock/test modes:
- **Frontend**: Mock payment API, local file storage
- **ESP32**: Simulated keypad, mock Supabase responses
- **Pico**: Mock printer responses

### Testing Checklist
- [ ] Frontend: Upload, payment flow, ID generation
- [ ] Supabase: Schema, RLS policies, cleanup jobs
- [ ] ESP32: WiFi, API calls, state transitions, OLED display
- [ ] Pico: UART parsing, print simulation
- [ ] End-to-end: Upload → Pay → Enter ID → Print → Cleanup

## Performance & Resource Constraints

- **ESP32**: ~250KB free heap for operations, async I/O
- **Pico**: ~150KB free SRAM, synchronous execution only
- **Network**: Assume 1-5 Mbps on kiosk WiFi
- **Print Job Size**: Limit to 50 MB per file
- **UART Bandwidth**: 115200 baud = ~14 KB/s

## Maintenance & Operations

- Daily log rotation (cloud and local)
- Weekly cleanup of orphaned files
- Monthly security audit of RLS policies
- Quarterly firmware updates (OTA preferred)
- Error notifications to admin dashboard

## License & Support

This is a proprietary system. Refer to your organization's license agreement.

For issues or questions, consult the architecture docs or contact the embedded systems team.

---

**Version**: 1.0  
**Last Updated**: 2026-01-29  
**Maintainers**: Full-stack & embedded systems team
