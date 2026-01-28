# Printosk API Specification

Complete REST API and protocol documentation for the printer kiosk system.

## Overview

The Printosk system uses three communication channels:

1. **Frontend ↔ Supabase**: REST API over HTTPS (standard Supabase)
2. **ESP32 ↔ Supabase**: REST API over HTTPS
3. **ESP32 ↔ Pico**: Serial UART protocol (local, frame-based)

## Part 1: REST API (Frontend & ESP32 ↔ Supabase)

All REST endpoints go through Supabase. Authentication uses JWT tokens or service role keys.

### Base URL
```
https://YOUR_SUPABASE_URL.supabase.co/rest/v1
```

### Headers (All Requests)
```
Authorization: Bearer <JWT_TOKEN or SERVICE_ROLE_KEY>
Content-Type: application/json
Accept: application/json
```

---

## Frontend Endpoints

### 1. Create User
**POST** `/users`

Request:
```json
{
  "email": "user@example.com",
  "phone_number": "+919876543210"
}
```

Response (201 Created):
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "user@example.com",
  "created_at": "2026-01-29T10:30:00Z",
  "total_prints_count": 0,
  "total_spent_cents": 0
}
```

---

### 2. Create Payment Order
**POST** `/payments`

Request:
```json
{
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "amount_cents": 50000,
  "currency_code": "INR"
}
```

Response (201 Created):
```json
{
  "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "razorpay_order_id": "order_HO2jqEhbqDxr8q",
  "status": "PENDING",
  "amount_cents": 50000,
  "created_at": "2026-01-29T10:30:00Z"
}
```

---

### 3. Verify Payment & Create Print Job
**POST** `/rpc/create_job_after_payment`

Call this function after Razorpay payment completion. It atomically:
- Verifies payment signature
- Creates print job with unique Print ID
- Updates user statistics

Request:
```json
{
  "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "payment_id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "job_title": "Resume",
  "color_mode": false,
  "copies": 2,
  "paper_size": "A4",
  "amount_cents": 50000
}
```

Response:
```json
{
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "print_id": 123456,
  "success": true,
  "message": "Job created"
}
```

---

### 4. Upload Print File
**POST** `/storage/v1/object/print-files/jobs/{job_id}/{filename}`

Upload file to Supabase Storage.

Headers:
```
Content-Type: application/pdf  (or image/jpeg, etc.)
Authorization: Bearer <JWT_TOKEN>
```

Request Body: Raw file bytes

Response (200 OK):
```json
{
  "name": "resume.pdf",
  "id": "12345678-abcd-ef01-2345-6789abcdef01",
  "updated_at": "2026-01-29T10:30:00Z",
  "created_at": "2026-01-29T10:30:00Z",
  "last_accessed_at": "2026-01-29T10:30:00Z",
  "metadata": {
    "eTag": "\"e7d2be6fd13d60be5ba5df9d3d22b2be\"",
    "mimetype": "application/pdf",
    "size": 512000
  }
}
```

---

### 5. Get Print Job Status
**GET** `/print_jobs?select=*&id=eq.{job_id}`

Retrieve job details for status checking.

Response:
```json
[
  {
    "id": "12345678-abcd-ef01-2345-6789abcdef01",
    "print_id_numeric": 123456,
    "user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "job_title": "Resume",
    "status": "PENDING",
    "status_message": null,
    "color_mode": false,
    "copies": 2,
    "total_pages": 2,
    "created_at": "2026-01-29T10:30:00Z",
    "updated_at": "2026-01-29T10:30:00Z",
    "completed_at": null
  }
]
```

---

## Kiosk (ESP32) Endpoints

### 1. Fetch Job by Print ID
**GET** `/print_jobs?select=*,print_files(*)&print_id_numeric=eq.{print_id}`

ESP32 uses this to fetch the job when user enters Print ID.

Response:
```json
[
  {
    "id": "12345678-abcd-ef01-2345-6789abcdef01",
    "print_id_numeric": 123456,
    "job_title": "Resume",
    "status": "PENDING",
    "color_mode": false,
    "copies": 2,
    "paper_size": "A4",
    "double_sided": false,
    "total_pages": 2,
    "file_count": 1,
    "created_at": "2026-01-29T10:30:00Z",
    "print_files": [
      {
        "id": "file-uuid-here",
        "original_filename": "resume.pdf",
        "file_size_bytes": 512000,
        "file_type": "pdf",
        "storage_path": "jobs/12345678-abcd-ef01-2345-6789abcdef01/resume.pdf",
        "page_count": 2
      }
    ]
  }
]
```

---

### 2. Update Job Status
**POST** `/rpc/update_job_status`

ESP32 calls this to update job status after print completion/error.

Request:
```json
{
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "new_status": "PRINTING",
  "status_msg": "Printing started",
  "updated_by_actor": "ESP32"
}
```

Response:
```json
[
  {
    "success": true,
    "message": "Status updated"
  }
]
```

Status values: `PENDING`, `PROCESSING`, `PRINTING`, `COMPLETED`, `FAILED`, `CANCELLED`, `DELETED`

---

### 3. Mark Job for Deletion
**POST** `/rpc/mark_job_for_deletion`

Called after successful print to schedule file cleanup.

Request:
```json
{
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01"
}
```

Response:
```json
[
  {
    "status": "SUCCESS",
    "message": "Job marked for deletion"
  }
]
```

---

### 4. Download File
**GET** `/storage/v1/object/print-files/{storage_path}`

Download file from Supabase Storage for printing.

Query Parameters:
- `download`: "true" (force download vs inline view)

Response: Raw file bytes

---

## Part 2: UART Protocol (ESP32 ↔ Pico)

Serial communication on UART2, 115200 baud, 8N1.

### Frame Format

```
[START][LENGTH][TYPE][PAYLOAD][CRC][END]
```

| Field | Bytes | Value | Description |
|-------|-------|-------|-------------|
| START | 1 | 0xAA | Frame start marker |
| LENGTH | 2 | 0-512 | Payload length (little-endian) |
| TYPE | 1 | 0x01-0xFF | Message type (see below) |
| PAYLOAD | 0-512 | varies | Message data (JSON or binary) |
| CRC | 1 | varies | CRC8 over TYPE+PAYLOAD |
| END | 1 | 0xBB | Frame end marker |

### Message Types

#### 0x01: PING
Health check.

Request (ESP32 → Pico):
```json
{
  "type": 0x01
}
```

Response (Pico → ESP32):
```json
{
  "type": 0x01,
  "status": 0  // Ready
}
```

---

#### 0x10: PRINT_COMMAND
Print job command.

Request (ESP32 → Pico):
```json
{
  "type": 0x10,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "total_pages": 2,
  "color": false,
  "copies": 2,
  "file_url": "https://supabase.co/storage/v1/object/print-files/jobs/.../resume.pdf?token=...",
  "mock_mode": false
}
```

Response (Pico → ESP32) on start:
```json
{
  "type": 0x20,
  "status": 1,  // STARTED
  "progress": 0,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "message": "Print job started"
}
```

Response (Pico → ESP32) during printing:
```json
{
  "type": 0x20,
  "status": 2,  // PRINTING
  "progress": 50,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "message": "Printing page 1 of 2"
}
```

Response (Pico → ESP32) on completion:
```json
{
  "type": 0x20,
  "status": 3,  // DONE
  "progress": 100,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "message": "Print completed successfully"
}
```

Response (Pico → ESP32) on error:
```json
{
  "type": 0x30,
  "status": 4,  // ERROR
  "progress": 0,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "message": "Printer offline"
}
```

---

#### 0x11: CANCEL_COMMAND
Cancel current print job.

Request (ESP32 → Pico):
```json
{
  "type": 0x11,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01"
}
```

Response (Pico → ESP32):
```json
{
  "type": 0x20,
  "status": 0,  // CANCELLED
  "progress": 0,
  "job_id": "12345678-abcd-ef01-2345-6789abcdef01",
  "message": "Print cancelled"
}
```

---

### Status Codes

| Code | Name | Description |
|------|------|-------------|
| 0x00 | READY | Pico ready, no job active |
| 0x01 | STARTED | Job started, initializing |
| 0x02 | PRINTING | Active printing |
| 0x03 | DONE | Job completed successfully |
| 0x04 | ERROR | Job failed with error |
| 0x05 | CANCELLED | Job cancelled by user |

---

### Error Codes (in status messages)

Common error messages and their meanings:

| Code | Message | Cause |
|------|---------|-------|
| 1001 | "Printer offline" | USB printer not detected |
| 1002 | "Print timeout" | Job exceeded max time limit |
| 1003 | "Paper jam" | Printer reported paper jam |
| 1004 | "Out of paper" | Printer out of paper |
| 1005 | "Parse error" | Command JSON invalid |
| 1006 | "File download failed" | Could not fetch file from Supabase |

---

## Part 3: Razorpay Payment Integration

### Webhook Endpoint
**POST** `/api/payments/webhook`

Razorpay sends payment updates to this endpoint. Verify signature before processing.

Request Body:
```json
{
  "event": "payment.authorized",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_XXXXXXXXXXXX",
        "entity": "payment",
        "amount": 50000,
        "currency": "INR",
        "status": "authorized",
        "order_id": "order_XXXXXXXXXXXX",
        "description": "Print Job",
        "email": "user@example.com",
        "contact": "+919876543210",
        "notes": {}
      }
    }
  }
}
```

Signature verification (HMAC SHA256):
```
hash = HMAC-SHA256("{orderId}|{paymentId}", RAZORPAY_SECRET)
if (hash !== signature) reject
```

Response (200 OK):
```json
{
  "status": "success"
}
```

---

## Sequence Diagrams

### Successful Print Flow

```
User                Frontend          Supabase        ESP32          Pico
  |                    |                  |              |             |
  |-- Upload file ---->|                  |              |             |
  |                    |-- Store file --->|              |             |
  |                    |<-- File ID ------|              |             |
  |                    |                  |              |             |
  |-- Select settings->|                  |              |             |
  |                    |-- Create payment->|             |             |
  |                    |<-- Payment ID ----|             |             |
  |                    |                  |              |             |
  |-- Pay via Razorpay->|                 |              |             |
  |<-- Verification ----|                 |              |             |
  |                    |-- Create job --->|             |             |
  |<-- Print ID -------|<-- Job created --|             |             |
  |                    |                  |              |             |
  | (User goes to kiosk and enters Print ID)            |             |
  |                    |                  |              |             |
  |                    |                  |<-- Fetch job--|             |
  |                    |                  |-- Job data -->|             |
  |                    |                  |              |             |
  |                    |                  |<-- Print cmd->|             |
  |                    |                  |              |-- Download->|
  |                    |                  |              |<-- File ----|
  |                    |                  |              |             |
  |                    |                  |<-- STARTED --|             |
  |                    |                  |              |-- Print --->|
  |                    |                  |              |<-- DONE ----|
  |                    |                  |              |             |
  |                    |<-- Status update-|<-- Mark deleted |            |
  |                    |-- Delete files-->|              |             |
  |                    |<-- Deleted ------|              |             |
```

---

## Rate Limits & Quotas

- **Frontend API**: 100 requests/minute per user
- **ESP32 API**: 10 requests/minute per device
- **File upload**: Max 50MB per file, 5 files per job
- **Payment**: 1 order per 5 seconds per user
- **Print jobs**: Max 100 concurrent jobs per Supabase project

---

## Error Handling

All endpoints return standard HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad request (validation error)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (RLS policy denied)
- **404**: Not found
- **409**: Conflict (duplicate entry)
- **500**: Server error

Error response format:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "details": {
    "field": "email",
    "error": "Must be valid email"
  }
}
```

---

## Testing with cURL

### Create user
```bash
curl -X POST 'https://PROJECT.supabase.co/rest/v1/users' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "phone_number": "+919876543210"
  }'
```

### Fetch job
```bash
curl -X GET 'https://PROJECT.supabase.co/rest/v1/print_jobs?print_id_numeric=eq.123456&select=*' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

### Update status
```bash
curl -X POST 'https://PROJECT.supabase.co/rest/v1/rpc/update_job_status' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "job_id": "uuid-here",
    "new_status": "PRINTING",
    "status_msg": "Printing started"
  }'
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-29 | Initial specification |

