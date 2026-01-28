# Database Schema Documentation

Detailed reference for the Printosk PostgreSQL schema.

## Tables

### users
Core user information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,                          -- Unique user ID
  email VARCHAR(255) UNIQUE NOT NULL,           -- Email (unique)
  phone_number VARCHAR(20),                     -- Optional phone
  created_at TIMESTAMP DEFAULT NOW(),           -- Account creation time
  updated_at TIMESTAMP DEFAULT NOW(),           -- Last update time
  is_active BOOLEAN DEFAULT TRUE,               -- Account status
  total_prints_count INT DEFAULT 0,             -- Statistics
  total_spent_cents INT DEFAULT 0               -- Statistics (in cents)
);
```

**Indexes**: `email`, `created_at`

**Notes**: 
- Email is the primary identifier
- Phone is optional for future notifications
- Statistics updated atomically with each print job

---

### print_jobs
Core print job tracking.

```sql
CREATE TABLE print_jobs (
  id UUID PRIMARY KEY,                           -- Job UUID
  user_id UUID NOT NULL REFERENCES users,        -- Owner
  print_id_numeric INT UNIQUE NOT NULL,          -- 6-digit user-friendly ID
  job_title VARCHAR(255) NOT NULL,               -- User-provided title
  description TEXT,                              -- Optional description
  
  -- Print settings
  color_mode BOOLEAN DEFAULT FALSE,              -- Color/B&W
  copies INT NOT NULL DEFAULT 1,                 -- 1-100 copies
  paper_size VARCHAR(20) DEFAULT 'A4',           -- A4, Letter, A3, etc.
  double_sided BOOLEAN DEFAULT FALSE,            -- Duplex printing
  
  -- Job lifecycle
  status VARCHAR(20) DEFAULT 'PENDING',          -- PENDING, PROCESSING, PRINTING, COMPLETED, FAILED
  status_message VARCHAR(255),                   -- Error/status details
  
  -- Payment & files
  payment_id UUID REFERENCES payments,           -- Associated payment
  amount_cents INT NOT NULL,                     -- Price in cents
  primary_file_id UUID REFERENCES print_files,   -- Main file
  file_count INT DEFAULT 1,                      -- Number of files
  total_pages INT,                               -- Total pages (calculated)
  
  -- Lifecycle timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,                        -- Completion time
  expires_at TIMESTAMP DEFAULT NOW() + 24h,      -- Auto-cleanup time
  
  -- Hardware tracking
  esp32_device_id VARCHAR(64),                   -- Which kiosk printed
  last_fetched_at TIMESTAMP,                     -- Last access time
  
  -- Deletion audit
  deletion_scheduled_at TIMESTAMP,               -- Marked for deletion
  deletion_confirmed_at TIMESTAMP                -- Actually deleted
);
```

**Indexes**: `user_id`, `print_id_numeric`, `status`, `created_at`, `expires_at`

**Constraints**:
- `copies` between 1 and 100
- Each user can have unlimited jobs
- Print ID is globally unique

**Lifecycle**:
1. Created in PENDING state
2. ESP32 fetches job (marked with last_fetched_at)
3. Status transitions: PENDING → PROCESSING → PRINTING → COMPLETED
4. After success, mark deletion_scheduled_at = NOW()
5. After 1+ hour, cleanup_completed_jobs() deletes files
6. Update deletion_confirmed_at

---

### print_files
File references and metadata.

```sql
CREATE TABLE print_files (
  id UUID PRIMARY KEY,                          -- File UUID
  print_job_id UUID NOT NULL REFERENCES print_jobs, -- Associated job
  
  -- File metadata
  original_filename VARCHAR(255) NOT NULL,      -- Original name
  file_size_bytes INT NOT NULL,                  -- Size for quota tracking
  file_type VARCHAR(20) NOT NULL,                -- pdf, docx, jpg, png
  mime_type VARCHAR(100),                        -- application/pdf, etc.
  
  -- Storage reference
  storage_bucket VARCHAR(100) DEFAULT 'print-files',
  storage_path VARCHAR(500) NOT NULL,            -- jobs/{job_id}/{name}
  
  -- Metadata
  page_count INT,                                -- Pages (for PDFs)
  
  -- Processing status
  processing_status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, CONVERTING, READY, DELETED
  error_message TEXT,                            -- If conversion failed
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP                           -- Soft delete time
);
```

**Indexes**: `print_job_id`, `storage_path`

**Notes**:
- Files are stored in Supabase Storage, not as BLOBs
- storage_path format: `jobs/{job_uuid}/{original_filename}`
- processing_status: Convert PDFs to printer-friendly format
- deleted_at is NULL until cleanup runs

---

### payments
Payment records with Razorpay integration.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,                           -- Printosk payment UUID
  user_id UUID NOT NULL REFERENCES users,        -- Payer
  
  -- Razorpay integration
  razorpay_order_id VARCHAR(100) UNIQUE,         -- From Razorpay
  razorpay_payment_id VARCHAR(100) UNIQUE,       -- From Razorpay
  razorpay_signature VARCHAR(500),               -- HMAC signature
  
  -- Amount
  amount_cents INT NOT NULL,                     -- Price (cents)
  currency_code VARCHAR(3) DEFAULT 'INR',        -- Currency code
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDING',          -- PENDING, INITIATED, COMPLETED, FAILED, CANCELLED, REFUNDED
  
  -- Security
  signature_verified BOOLEAN DEFAULT FALSE,      -- Webhook verified
  verified_at TIMESTAMP,                         -- Verification time
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**: `user_id`, `razorpay_order_id`, `status`, `created_at`

**Constraints**:
- Never store credit card data (Razorpay handles it)
- Only store order/payment IDs and signature

**Lifecycle**:
1. Create PENDING payment record (webhook initiated)
2. Razorpay returns order_id
3. User completes payment
4. Webhook received with payment_id + signature
5. Verify signature, set verified=true
6. Set status=COMPLETED
7. Frontend creates print job

---

### job_status_history
Audit log of state transitions.

```sql
CREATE TABLE job_status_history (
  id UUID PRIMARY KEY,
  print_job_id UUID NOT NULL REFERENCES print_jobs,
  
  -- State change
  previous_status VARCHAR(20),                   -- Old state
  new_status VARCHAR(20) NOT NULL,               -- New state
  status_message VARCHAR(255),                   -- Reason/details
  
  -- Who changed it
  updated_by VARCHAR(50),                        -- FRONTEND, ESP32, PICO, SYSTEM
  device_id VARCHAR(64),                         -- Device identifier
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**: `print_job_id`, `created_at`

**Purpose**: 
- Audit trail for compliance
- Debugging state transitions
- Tracking which device updated status

**Example**:
```
previous_status | new_status | updated_by | message
PENDING         | PROCESSING | ESP32      | Job fetched from kiosk
PROCESSING      | PRINTING   | PICO       | Printer initialized
PRINTING        | COMPLETED  | PICO       | All pages printed
COMPLETED       | DELETED    | SYSTEM     | Cleanup cleanup_completed_jobs()
```

---

### audit_logs
General audit trail for security & compliance.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  
  -- Operation
  operation VARCHAR(50) NOT NULL,                -- FILE_UPLOAD, PAYMENT, PRINT_START, FILE_DELETE
  resource_type VARCHAR(50),                     -- users, print_jobs, payments
  resource_id VARCHAR(100),                      -- Resource ID
  
  -- Actor
  actor_type VARCHAR(20),                        -- FRONTEND, ESP32, PICO, SYSTEM, USER
  actor_id VARCHAR(100),                         -- User/device ID
  
  -- Details
  details JSONB,                                 -- Operation details (JSON)
  status VARCHAR(20),                            -- SUCCESS, FAILURE
  error_details TEXT,                            -- Error message if failed
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**: `operation`, `resource_type, resource_id`, `created_at`

**Examples**:
```json
{
  "operation": "FILE_UPLOAD",
  "resource_type": "print_files",
  "actor_type": "FRONTEND",
  "status": "SUCCESS",
  "details": {
    "file_id": "uuid",
    "size_bytes": 512000,
    "file_type": "pdf"
  }
}

{
  "operation": "PAYMENT_COMPLETED",
  "resource_type": "payments",
  "actor_type": "SYSTEM",
  "status": "SUCCESS",
  "details": {
    "amount_cents": 50000,
    "order_id": "order_HO2jq...",
    "payment_id": "pay_XXXXX"
  }
}

{
  "operation": "PRINT_JOB_CREATED",
  "resource_type": "print_jobs",
  "actor_type": "SYSTEM",
  "status": "SUCCESS",
  "details": {
    "print_id": 123456,
    "copies": 2,
    "color_mode": false
  }
}
```

---

## Views

### latest_job_status

Convenience view for fetching job with status and file count.

```sql
CREATE VIEW latest_job_status AS
SELECT 
  pj.id,
  pj.print_id_numeric,
  pj.user_id,
  pj.job_title,
  pj.status,
  pj.status_message,
  pj.created_at,
  pj.updated_at,
  pj.completed_at,
  pj.total_pages,
  pj.copies,
  pj.color_mode,
  COUNT(pf.id) AS file_count
FROM print_jobs pj
LEFT JOIN print_files pf ON pj.id = pf.print_job_id
GROUP BY pj.id, pj.print_id_numeric, ...;
```

**Usage**:
```sql
-- Get job with files
SELECT * FROM latest_job_status WHERE print_id_numeric = 123456;
```

---

## Functions

### generate_print_id()
Generate unique 6-digit Print ID.

```sql
CREATE FUNCTION generate_print_id() RETURNS INT AS $$
  LOOP
    new_id := 100000 + floor(random() * 900000)::INT;
    SELECT EXISTS(...) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$$;
```

**Guarantees**: Always returns 6-digit unique number (100000-999999)

---

### mark_job_for_deletion(job_id UUID)
Schedule job files for deletion.

```sql
-- Called after successful print
UPDATE print_jobs SET deletion_scheduled_at = NOW() WHERE id = job_id;
```

---

### cleanup_completed_jobs()
Delete files 1+ hour after being marked.

```sql
-- Can be run manually or via pg_cron
DELETE FROM print_files WHERE print_job_id IN (
  SELECT id FROM print_jobs 
  WHERE deletion_scheduled_at < NOW() - '1 hour'::INTERVAL
);
```

---

### update_job_status(job_id, new_status, status_msg, updated_by)
Atomically update job status with history.

---

### create_job_after_payment(user_id, payment_id, ...)
Atomically create job after payment verification.

---

## Relationships

```
users
  ├─ 1:N → print_jobs (user_id)
  │         ├─ 1:N → print_files (print_job_id)
  │         ├─ 1:N → job_status_history
  │         └─ 1:1 → payments (payment_id)
  │
  └─ 1:N → payments (user_id)

payments
  └─ 1:N → print_jobs

print_files
  └─ 1:N → storage objects (storage_path)

audit_logs
  └─ references any resource_type/resource_id
```

---

## Security Policies

All tables have Row-Level Security (RLS) enabled:

**users**: Users read/write own profile only  
**print_jobs**: Users see only their own jobs  
**print_files**: Users see only files for their jobs  
**payments**: Users see only their own payments  
**audit_logs**: Filtered by actor_id and resource_id  

Service role can read/write all (for admin/cleanup operations).

---

## Quotas & Limits

| Item | Limit | Notes |
|------|-------|-------|
| File size | 50 MB | Per file |
| Files per job | 5 | Multiple uploads |
| Total storage | 1 GB | Supabase free tier |
| Jobs per day | 1000 | Scale as needed |
| Concurrent jobs | 10 | Pico throughput |
| Job retention | 24 hours | Then deleted |
| API rate | 100 req/min | Per user |

---

## Query Examples

### Get all jobs for a user
```sql
SELECT * FROM print_jobs WHERE user_id = 'user-uuid' ORDER BY created_at DESC;
```

### Get completed jobs ready for cleanup
```sql
SELECT * FROM print_jobs 
WHERE status = 'COMPLETED' 
  AND deletion_scheduled_at IS NULL
  AND updated_at < NOW() - '1 hour'::INTERVAL;
```

### Get job with file details
```sql
SELECT 
  pj.id, pj.print_id_numeric, pj.job_title, pj.status,
  pf.original_filename, pf.file_size_bytes, pf.storage_path
FROM print_jobs pj
LEFT JOIN print_files pf ON pj.id = pf.print_job_id
WHERE pj.print_id_numeric = 123456;
```

### Get payment history for user
```sql
SELECT * FROM payments 
WHERE user_id = 'user-uuid' 
  AND status = 'COMPLETED'
ORDER BY created_at DESC
LIMIT 10;
```

### Get audit logs for a job
```sql
SELECT * FROM audit_logs 
WHERE resource_type = 'print_jobs' 
  AND resource_id = 'job-uuid'
ORDER BY created_at;
```

---

## Backups

Supabase handles automatic backups:
- Daily backups retained for 7 days
- Weekly backups retained for 4 weeks
- Manual backups can be created anytime

To restore from backup:
1. Go to Project Settings → Backups
2. Click "Restore" on desired backup
3. Confirm (this will restore entire database)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-29 | Initial schema |

