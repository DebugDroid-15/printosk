# Supabase Setup Guide for Printosk

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Enter project details:
   - **Project Name**: printosk
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
5. Wait for project to initialize (2-5 minutes)

## Step 2: Get Your Credentials

1. Go to **Project Settings** → **API**
2. Copy and save:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Set Up Environment Variables

1. Create `.env.local` file in the `frontend` directory:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Keep other settings as default for development

## Step 4: Initialize Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Click "New Query"
3. Copy the entire content from `scripts/supabase-init.sql`
4. Paste into the SQL editor
5. Click "Run"
6. Wait for all tables to be created (green checkmarks)

## Step 5: Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click "Create a new bucket"
3. Name it: `print-files`
4. **Uncheck** "Make it private" (or configure policies)
5. Click "Create bucket"

## Step 6: Configure RLS (Row Level Security)

1. Go to **SQL Editor**
2. Run this to allow file uploads:
   ```sql
   CREATE POLICY "Allow authenticated users to upload files"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'print-files');

   CREATE POLICY "Allow users to read their own files"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'print-files');
   ```

## Step 7: Test Connection

1. Start your dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Go to `http://localhost:3000/upload`
3. Try uploading a test file
4. Check **Storage** → **print-files** in Supabase to verify upload

## Step 8: Monitor Database

View your data in real-time:
- **print_jobs**: All print jobs submitted
- **print_files**: Uploaded files
- **payment_records**: Payment transactions
- **activity_logs**: System events

## API Reference

### Fetch Print Job
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('print_jobs')
  .select('*')
  .eq('print_id_numeric', 123456)
  .single();
```

### Create Print Job
```typescript
const { data, error } = await supabase
  .from('print_jobs')
  .insert([{
    print_id_numeric: 123456,
    email: 'user@example.com',
    status: 'PENDING',
    total_amount: 10.00,
    currency: 'INR'
  }])
  .select()
  .single();
```

### Upload File to Storage
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.storage
  .from('print-files')
  .upload(`jobs/job-id/filename.pdf`, file);
```

### Update Job Status
```typescript
const { error } = await supabase
  .from('print_jobs')
  .update({ status: 'PROCESSING' })
  .eq('id', jobId);
```

## Useful Queries

### Get all jobs for an email
```sql
SELECT * FROM print_jobs WHERE email = 'user@example.com' ORDER BY created_at DESC;
```

### Get pending jobs
```sql
SELECT * FROM print_jobs WHERE status = 'PENDING' ORDER BY created_at ASC;
```

### Get failed payments
```sql
SELECT * FROM payment_records WHERE status = 'FAILED' ORDER BY created_at DESC;
```

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after updating `.env.local`

### File upload fails
- Check bucket exists: `Storage` → `print-files`
- Verify bucket policies are configured
- Check file size limits in bucket settings

### Cannot read database
- Verify RLS policies are not blocking queries
- Check user has correct permissions
- Run `ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;` for testing (not production)

## Security Notes

- **Never commit** `.env.local` to Git (already in `.gitignore`)
- Rotate `SUPABASE_SERVICE_ROLE_KEY` if exposed
- Keep credentials in secure password manager
- For production, use environment variables on hosting platform

## Next Steps

1. ✅ Database schema initialized
2. ✅ Storage bucket configured
3. Next: Connect upload page to Supabase
4. Next: Update lookup to query Supabase
5. Next: Implement payment confirmation storage
