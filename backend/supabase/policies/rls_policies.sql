-- Printosk: Row-Level Security Policies
-- Enables secure, multi-tenant data isolation

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS POLICIES
-- ============================================================================
-- Users can only read/update their own profile
CREATE POLICY "users_select_self" ON users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_update_self" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- Only system/admin can create users
CREATE POLICY "users_insert_system" ON users
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' OR auth.role() = 'service_role'
  );

-- ============================================================================
-- PRINT JOBS POLICIES
-- ============================================================================
-- Users can only see their own jobs
CREATE POLICY "print_jobs_select_own" ON print_jobs
  FOR SELECT
  USING (user_id = auth.uid());

-- Frontend can create jobs after payment verification
CREATE POLICY "print_jobs_insert_own" ON print_jobs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own jobs (status, metadata)
CREATE POLICY "print_jobs_update_own" ON print_jobs
  FOR UPDATE
  USING (user_id = auth.uid());

-- System can update via functions
CREATE POLICY "print_jobs_update_system" ON print_jobs
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PRINT FILES POLICIES
-- ============================================================================
-- Users can only access files for their own jobs
CREATE POLICY "print_files_select_own_jobs" ON print_files
  FOR SELECT
  USING (
    print_job_id IN (
      SELECT id FROM print_jobs WHERE user_id = auth.uid()
    )
  );

-- Users can upload files to their jobs
CREATE POLICY "print_files_insert_own_jobs" ON print_files
  FOR INSERT
  WITH CHECK (
    print_job_id IN (
      SELECT id FROM print_jobs WHERE user_id = auth.uid()
    )
  );

-- System can delete files during cleanup
CREATE POLICY "print_files_delete_system" ON print_files
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================
-- Users can only see their own payments
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT
  USING (user_id = auth.uid());

-- System creates payments after order initiation
CREATE POLICY "payments_insert_system" ON payments
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- System updates payments after webhook confirmation
CREATE POLICY "payments_update_system" ON payments
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- JOB STATUS HISTORY POLICIES
-- ============================================================================
-- Users can view history of their own jobs
CREATE POLICY "status_history_select_own_jobs" ON job_status_history
  FOR SELECT
  USING (
    print_job_id IN (
      SELECT id FROM print_jobs WHERE user_id = auth.uid()
    )
  );

-- System logs status changes
CREATE POLICY "status_history_insert_system" ON job_status_history
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================
-- Only service role can write audit logs
CREATE POLICY "audit_logs_insert_system" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Users can view their own audit records
CREATE POLICY "audit_logs_select_own" ON audit_logs
  FOR SELECT
  USING (
    actor_id = auth.uid()::TEXT
    OR resource_id IN (
      SELECT id::TEXT FROM print_jobs WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================
-- Create storage policies for print-files bucket

-- Users can upload files to their own job directory
CREATE POLICY "upload_print_files" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'print-files'
    AND auth.role() = 'authenticated'
  );

-- Users can download their own files
CREATE POLICY "download_print_files" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'print-files'
    AND auth.role() = 'authenticated'
  );

-- System can delete files during cleanup
CREATE POLICY "delete_print_files_system" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'print-files'
    AND auth.role() = 'service_role'
  );

-- ============================================================================
-- API KEY / SERVICE ROLE POLICIES
-- ============================================================================
-- ESP32 can fetch jobs by print_id but only the unprintted ones
-- This assumes ESP32 authenticates via API key with service_role

-- View for ESP32 to fetch job by numeric ID (read-only)
CREATE VIEW esp32_job_fetch AS
SELECT 
  id,
  print_id_numeric,
  job_title,
  color_mode,
  copies,
  paper_size,
  double_sided,
  status,
  total_pages,
  file_count,
  created_at
FROM print_jobs
WHERE status IN ('PENDING', 'PROCESSING')
AND expires_at > NOW();

-- Service role can insert device tracking
CREATE POLICY "jobs_insert_esp32_fetch" ON print_jobs
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON POLICY "users_select_self" ON users IS
  'Users can only view their own profile data.';

COMMENT ON POLICY "print_jobs_select_own" ON print_jobs IS
  'Users can only see print jobs they created.';

COMMENT ON POLICY "payments_select_own" ON payments IS
  'Users can only view their own payment records.';

COMMENT ON POLICY "delete_print_files_system" ON storage.objects IS
  'Automatic file deletion via cleanup_completed_jobs() function.';

COMMENT ON VIEW esp32_job_fetch IS
  'ESP32-accessible view of pending jobs filtered by print_id. ESP32 authenticates via service role API key.';
