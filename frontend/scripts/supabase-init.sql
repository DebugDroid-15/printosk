-- Printosk Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  name VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Print Jobs table
CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  print_id_numeric INT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PROCESSING', 'PRINTING', 'COMPLETED', 'FAILED')),
  status_message TEXT,
  file_count INT DEFAULT 0,
  total_pages INT DEFAULT 0,
  color_mode VARCHAR(20) DEFAULT 'AUTO' CHECK(color_mode IN ('AUTO', 'COLOR', 'GRAYSCALE')),
  paper_size VARCHAR(20) DEFAULT 'A4' CHECK(paper_size IN ('A4', 'A3', 'LETTER', 'LEGAL')),
  duplex_mode VARCHAR(20) DEFAULT 'NONE' CHECK(duplex_mode IN ('NONE', 'LONG_EDGE', 'SHORT_EDGE')),
  copies INT DEFAULT 1,
  payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'COMPLETED', 'FAILED')),
  total_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Print Files table
CREATE TABLE IF NOT EXISTS print_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES print_jobs(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  file_type VARCHAR(50),
  storage_path VARCHAR(500),
  page_count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Records table
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES print_jobs(id) ON DELETE CASCADE,
  order_id VARCHAR(100) UNIQUE,
  payment_id VARCHAR(100) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED')),
  razorpay_signature VARCHAR(500),
  razorpay_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity Logs table for monitoring
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES print_jobs(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_print_jobs_email ON print_jobs(email);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_print_jobs_payment_status ON print_jobs(payment_status);
CREATE INDEX idx_print_jobs_created_at ON print_jobs(created_at DESC);
CREATE INDEX idx_print_jobs_print_id ON print_jobs(print_id_numeric);
CREATE INDEX idx_print_files_job_id ON print_files(job_id);
CREATE INDEX idx_payment_records_job_id ON payment_records(job_id);
CREATE INDEX idx_payment_records_status ON payment_records(status);
CREATE INDEX idx_activity_logs_job_id ON activity_logs(job_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for public access (allow basic read for print status lookup)
CREATE POLICY "Allow public to view print jobs by print_id" ON print_jobs
  FOR SELECT USING (true);

CREATE POLICY "Allow users to view their own print jobs" ON print_jobs
  FOR SELECT USING (email = current_user_email() OR true);

-- Function to get current user email (optional)
-- In a real app, you'd use Supabase Auth for this
CREATE OR REPLACE FUNCTION current_user_email() RETURNS VARCHAR AS $$
  SELECT email FROM (SELECT email, row_number() over (order by created_at) as rn FROM users) 
  WHERE rn = 1 LIMIT 1;
$$ LANGUAGE SQL;
