-- Printosk: Initial Database Schema
-- Created: 2026-01-29
-- Supabase PostgreSQL Database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user information and payment details
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  total_prints_count INT DEFAULT 0,
  total_spent_cents INT DEFAULT 0  -- in cents (e.g., 5000 = $50)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- PRINT JOBS TABLE
-- ============================================================================
-- Core table for print job tracking
CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Print ID is human-friendly numeric identifier (e.g., 123456)
  print_id_numeric INT UNIQUE NOT NULL,
  
  -- Job metadata
  job_title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Print settings
  color_mode BOOLEAN NOT NULL DEFAULT FALSE,  -- true = color, false = B&W
  copies INT NOT NULL DEFAULT 1 CHECK(copies > 0 AND copies <= 100),
  paper_size VARCHAR(20) DEFAULT 'A4',        -- A4, Letter, A3, etc.
  double_sided BOOLEAN DEFAULT FALSE,
  
  -- Job status: PENDING, PROCESSING, PRINTING, COMPLETED, FAILED, CANCELLED
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  status_message VARCHAR(255),
  
  -- Payment information
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount_cents INT NOT NULL,  -- in cents
  
  -- File references
  primary_file_id UUID REFERENCES print_files(id) ON DELETE SET NULL,
  file_count INT DEFAULT 1,
  total_pages INT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),  -- Auto-cleanup after 24h
  
  -- Hardware tracking
  esp32_device_id VARCHAR(64),  -- MAC address or device UUID
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  deletion_scheduled_at TIMESTAMP WITH TIME ZONE,
  deletion_confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_print_jobs_user_id ON print_jobs(user_id);
CREATE INDEX idx_print_jobs_print_id ON print_jobs(print_id_numeric);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_print_jobs_created_at ON print_jobs(created_at);
CREATE INDEX idx_print_jobs_expires_at ON print_jobs(expires_at);

-- ============================================================================
-- PRINT FILES TABLE
-- ============================================================================
-- Stores references to uploaded files and their metadata
CREATE TABLE print_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  print_job_id UUID NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
  
  -- File metadata
  original_filename VARCHAR(255) NOT NULL,
  file_size_bytes INT NOT NULL,
  file_type VARCHAR(20) NOT NULL,  -- pdf, docx, jpg, png, etc.
  mime_type VARCHAR(100),
  
  -- Supabase storage path
  storage_bucket VARCHAR(100) DEFAULT 'print-files',
  storage_path VARCHAR(500) NOT NULL,  -- e.g., "jobs/uuid/filename.pdf"
  
  -- Page information
  page_count INT,
  
  -- Status
  processing_status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, CONVERTING, READY, DELETED
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_print_files_job_id ON print_files(print_job_id);
CREATE INDEX idx_print_files_storage_path ON print_files(storage_path);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
-- Secure payment tracking with Razorpay integration
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Razorpay integration
  razorpay_order_id VARCHAR(100) UNIQUE,
  razorpay_payment_id VARCHAR(100) UNIQUE,
  razorpay_signature VARCHAR(500),  -- Verified signature from webhook
  
  -- Amount & currency
  amount_cents INT NOT NULL,  -- in cents (e.g., 5000 = $50)
  currency_code VARCHAR(3) DEFAULT 'INR',
  
  -- Status: PENDING, INITIATED, COMPLETED, FAILED, CANCELLED, REFUNDED
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  
  -- Verification
  signature_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_razorpay_id ON payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ============================================================================
-- JOB STATUS HISTORY TABLE
-- ============================================================================
-- Audit log for job state transitions
CREATE TABLE job_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  print_job_id UUID NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
  
  -- State transition
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  status_message VARCHAR(255),
  
  -- Source of status update
  updated_by VARCHAR(50),  -- 'FRONTEND', 'ESP32', 'PICO', 'SYSTEM'
  device_id VARCHAR(64),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_status_history_job_id ON job_status_history(print_job_id);
CREATE INDEX idx_status_history_created_at ON job_status_history(created_at);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================
-- Track all sensitive operations for compliance
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Operation details
  operation VARCHAR(50) NOT NULL,  -- FILE_UPLOAD, PAYMENT, PRINT_START, FILE_DELETE, etc.
  resource_type VARCHAR(50),       -- users, print_jobs, print_files, etc.
  resource_id VARCHAR(100),
  
  -- Actor
  actor_type VARCHAR(20),          -- FRONTEND, ESP32, PICO, SYSTEM, USER
  actor_id VARCHAR(100),
  
  -- Details
  details JSONB,
  status VARCHAR(20),              -- SUCCESS, FAILURE
  error_details TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- VIEW: Latest Job Status
-- ============================================================================
-- Convenient view for fetching job with its latest status
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
GROUP BY pj.id, pj.print_id_numeric, pj.user_id, pj.job_title, pj.status, 
         pj.status_message, pj.created_at, pj.updated_at, pj.completed_at,
         pj.total_pages, pj.copies, pj.color_mode;

-- ============================================================================
-- FUNCTION: Generate unique numeric Print ID
-- ============================================================================
-- Generates a random 6-digit numeric print ID
CREATE OR REPLACE FUNCTION generate_print_id()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id INT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-digit number (100000-999999)
    new_id := 100000 + floor(random() * 900000)::INT;
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM print_jobs WHERE print_id_numeric = new_id) INTO id_exists;
    
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- ============================================================================
-- FUNCTION: Mark job for secure deletion
-- ============================================================================
-- Called after successful print to schedule file deletion
CREATE OR REPLACE FUNCTION mark_job_for_deletion(job_id UUID)
RETURNS TABLE(status VARCHAR, message VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update print_jobs to mark for deletion
  UPDATE print_jobs
  SET deletion_scheduled_at = NOW(),
      status = 'COMPLETED'
  WHERE id = job_id AND status != 'FAILED';
  
  -- Log the deletion request
  INSERT INTO audit_logs (operation, resource_type, resource_id, actor_type, details, status)
  VALUES ('FILE_DELETE_SCHEDULED', 'print_jobs', job_id::TEXT, 'SYSTEM', 
          jsonb_build_object('scheduled_at', NOW()), 'SUCCESS');
  
  RETURN QUERY SELECT 'SUCCESS'::VARCHAR, 'Job marked for deletion'::VARCHAR;
END;
$$;

-- ============================================================================
-- FUNCTION: Securely delete completed jobs (cron job compatible)
-- ============================================================================
-- Deletes files from storage and database for jobs marked for deletion
CREATE OR REPLACE FUNCTION cleanup_completed_jobs()
RETURNS TABLE(deleted_count INT, error_message VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INT := 0;
  v_error_msg VARCHAR := NULL;
BEGIN
  BEGIN
    -- Find jobs ready for deletion (scheduled > 1 hour ago)
    DELETE FROM print_files
    WHERE print_job_id IN (
      SELECT id FROM print_jobs
      WHERE deletion_scheduled_at IS NOT NULL
      AND deletion_confirmed_at IS NULL
      AND deletion_scheduled_at < NOW() - INTERVAL '1 hour'
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Mark jobs as deletion confirmed
    UPDATE print_jobs
    SET deletion_confirmed_at = NOW(),
        status = 'DELETED'
    WHERE deletion_scheduled_at IS NOT NULL
    AND deletion_confirmed_at IS NULL
    AND deletion_scheduled_at < NOW() - INTERVAL '1 hour';
    
    -- Log cleanup
    INSERT INTO audit_logs (operation, resource_type, actor_type, details, status)
    VALUES ('FILES_CLEANUP', 'print_files', 'SYSTEM', 
            jsonb_build_object('deleted_files', v_deleted_count), 'SUCCESS');
  
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    INSERT INTO audit_logs (operation, resource_type, actor_type, details, status, error_details)
    VALUES ('FILES_CLEANUP', 'print_files', 'SYSTEM', 
            jsonb_build_object('error', v_error_msg), 'FAILURE', v_error_msg);
  END;
  
  RETURN QUERY SELECT v_deleted_count, v_error_msg::VARCHAR;
END;
$$;

-- ============================================================================
-- FUNCTION: Update job status atomically
-- ============================================================================
-- Safely update job status and maintain history
CREATE OR REPLACE FUNCTION update_job_status(
  job_id UUID,
  new_status VARCHAR,
  status_msg VARCHAR DEFAULT NULL,
  updated_by_actor VARCHAR DEFAULT 'SYSTEM'
)
RETURNS TABLE(success BOOLEAN, message VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_status VARCHAR;
BEGIN
  -- Fetch current status
  SELECT status INTO v_previous_status FROM print_jobs WHERE id = job_id;
  
  -- Update status if different
  IF v_previous_status != new_status THEN
    UPDATE print_jobs
    SET status = new_status,
        status_message = COALESCE(status_msg, status_message),
        updated_at = NOW(),
        completed_at = CASE WHEN new_status = 'COMPLETED' THEN NOW() ELSE completed_at END
    WHERE id = job_id;
    
    -- Record in history
    INSERT INTO job_status_history (print_job_id, previous_status, new_status, status_message, updated_by)
    VALUES (job_id, v_previous_status, new_status, status_msg, updated_by_actor);
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Status updated'::VARCHAR;
END;
$$;

-- ============================================================================
-- FUNCTION: Validate payment & create print job
-- ============================================================================
-- Atomically create job after payment verification
CREATE OR REPLACE FUNCTION create_job_after_payment(
  user_id UUID,
  payment_id UUID,
  job_title VARCHAR,
  color_mode BOOLEAN,
  copies INT,
  paper_size VARCHAR,
  amount_cents INT
)
RETURNS TABLE(job_id UUID, print_id INT, success BOOLEAN, message VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_print_id INT;
  v_new_job_id UUID;
BEGIN
  -- Verify payment status
  IF NOT EXISTS(SELECT 1 FROM payments WHERE id = payment_id AND status = 'COMPLETED') THEN
    RETURN QUERY SELECT NULL::UUID, NULL::INT, FALSE, 'Payment not completed'::VARCHAR;
    RETURN;
  END IF;
  
  -- Generate unique print ID
  v_new_print_id := generate_print_id();
  
  -- Create print job
  INSERT INTO print_jobs (
    user_id, print_id_numeric, job_title, color_mode, copies,
    paper_size, status, payment_id, amount_cents
  )
  VALUES (
    user_id, v_new_print_id, job_title, color_mode, copies,
    paper_size, 'PENDING', payment_id, amount_cents
  )
  RETURNING id INTO v_new_job_id;
  
  -- Update user's print count
  UPDATE users
  SET total_prints_count = total_prints_count + 1,
      total_spent_cents = total_spent_cents + amount_cents
  WHERE id = user_id;
  
  -- Log job creation
  INSERT INTO audit_logs (operation, resource_type, resource_id, actor_type, details, status)
  VALUES ('PRINT_JOB_CREATED', 'print_jobs', v_new_job_id::TEXT, 'FRONTEND',
          jsonb_build_object('print_id', v_new_print_id, 'copies', copies), 'SUCCESS');
  
  RETURN QUERY SELECT v_new_job_id, v_new_print_id, TRUE, 'Job created'::VARCHAR;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update print_jobs.updated_at on modification
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_print_jobs_timestamp
  BEFORE UPDATE ON print_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_payments_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE users IS
  'User accounts and print statistics. Email is unique identifier for anonymous users.';

COMMENT ON TABLE print_jobs IS
  'Core print job tracking. print_id_numeric is user-friendly identifier entered at kiosk.';

COMMENT ON TABLE print_files IS
  'File references with storage paths. Deleted after successful print via cleanup_completed_jobs().';

COMMENT ON TABLE payments IS
  'Payment records with Razorpay integration. Never stores sensitive payment data beyond order/payment IDs.';

COMMENT ON COLUMN print_jobs.status IS
  'Job lifecycle: PENDING → PROCESSING → PRINTING → COMPLETED or FAILED';

COMMENT ON COLUMN print_files.processing_status IS
  'File conversion status: PENDING → CONVERTING → READY, or DELETED after print';

COMMENT ON FUNCTION cleanup_completed_jobs() IS
  'Scheduled cleanup function. Run via pg_cron: SELECT cron.schedule(''cleanup-jobs'', ''*/5 * * * *'', ''SELECT cleanup_completed_jobs()'');';
