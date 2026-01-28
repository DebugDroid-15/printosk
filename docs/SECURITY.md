# Printosk Security & Privacy Guide

Security architecture and best practices for the printer kiosk system.

## Overview

Printosk is designed with security as a core principle. This guide covers:
- Data protection measures
- Authentication & authorization
- Secure file handling
- Privacy & data deletion
- Threat model
- Compliance considerations

---

## Part 1: Data Classification

### Public Data
- Printer models supported
- Pricing tiers
- General service information

**Protection**: None required

### Internal Data
- System logs
- Performance metrics
- Error messages

**Protection**: Access restricted to staff; no customer PII

### Customer Data
- Email addresses
- Phone numbers (optional)
- Print job metadata
- Payment references

**Protection**: Encrypted in transit (HTTPS), encrypted at rest (Supabase), RLS policies

### Sensitive Data
- Uploaded files (PDFs, documents)
- Razorpay payment signatures
- JWT tokens

**Protection**: Encrypted in transit, automatic deletion after print, signed webhooks

---

## Part 2: Authentication & Authorization

### Frontend (User)

**Method**: Email-based, Stateless  
**Token**: JWT from Supabase (valid 1 hour)

```
User → Frontend: Email
Frontend → Supabase: Create user or sign in
Supabase → Frontend: JWT token (exp: 1h)
Frontend: Store JWT in secure httpOnly cookie
All requests: Include `Authorization: Bearer <JWT>`
```

**Implementation**:
```typescript
// lib/supabase.ts
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'generated-token'  // Not password-based in our design
});
```

### ESP32 (Kiosk Device)

**Method**: API Key (Service Role)  
**Authentication**: Header-based

```
ESP32 → Supabase: Authorization: Bearer <SERVICE_ROLE_KEY>
Supabase: Allow fetch jobs, update status
```

**Implementation**:
```cpp
// config.h
#define SUPABASE_API_KEY "eyJ0eXAiOiJKV1QiLCJhbGc..."  // Service role

// In requests
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Security Notes**:
- Service role key is **NEVER** exposed to frontend
- Use environment variables in production
- Rotate keys quarterly

### Pico (Printer Driver)

**Method**: No direct Supabase access  
**Authentication**: None (local UART only)

```
Pico ← ESP32: Commands via UART (physically secure)
ESP32 ← Supabase: Fetch job, download file
Pico ← ESP32: Provides file for printing
```

**Security Notes**:
- Pico doesn't authenticate to internet
- UART is local, no eavesdropping risk
- No credentials needed on Pico

---

## Part 3: Row-Level Security (RLS)

All tables have RLS policies. Examples:

### Users Table
```sql
-- Users can only read their own profile
CREATE POLICY "users_select_self" ON users
  FOR SELECT
  USING (id = auth.uid());
```

### Print Jobs Table
```sql
-- Users see only their own jobs
CREATE POLICY "print_jobs_select_own" ON print_jobs
  FOR SELECT
  USING (user_id = auth.uid());
```

### Effect
```sql
-- User A queries print_jobs
SELECT * FROM print_jobs;
-- Automatically becomes:
SELECT * FROM print_jobs WHERE user_id = 'USER_A_ID';

-- User B's data is invisible to User A
-- Even if User B's job ID is known, User A can't access it
```

---

## Part 4: File Security

### Upload
1. User uploads via HTTPS to Vercel
2. Vercel streams to Supabase Storage (signed URL)
3. File stored with path: `jobs/{job_id}/{filename}`
4. File is **private** (not publicly accessible)

### Access
- Only job owner can read file
- ESP32 gets signed, time-limited URL from Supabase
- ESP32 downloads file to Pico
- Pico stores in RAM only (no persistent storage)

### Deletion
- After successful print, `mark_job_for_deletion()` is called
- deletion_scheduled_at is set to NOW()
- `cleanup_completed_jobs()` function runs every hour (via pg_cron)
- Files deleted after 1+ hour
- Supabase Storage auto-purges deleted records

**Implementation**:
```sql
-- After successful print
SELECT mark_job_for_deletion('job-id');

-- Cleanup job (scheduled hourly)
DELETE FROM print_files 
WHERE print_job_id IN (
  SELECT id FROM print_jobs 
  WHERE deletion_scheduled_at < NOW() - '1 hour'::INTERVAL
);

-- Verify deletion
SELECT * FROM print_files WHERE job_id = 'job-id';
-- Returns 0 rows
```

---

## Part 5: Payment Security

### Razorpay Integration

**Never store**: Credit card data, CVV, expiry date  
**Always verify**: Webhook signatures

```php
// Example: Verify Razorpay signature
$hash = hash('sha256', "{$orderId}|{$paymentId}", $secret);
if ($hash !== $signature) {
  throw new Exception("Invalid signature");
}
```

**Flow**:
1. Frontend initiates order in Supabase
2. Frontend opens Razorpay checkout
3. User enters card details directly to Razorpay
4. Razorpay returns payment ID + signature
5. Vercel webhook endpoint verifies signature
6. Create print job if verified

**Implementation** (`api/payments/webhook`):
```typescript
export async function POST(req: Request) {
  const { orderId, paymentId, signature } = await req.json();
  
  // Verify signature
  const hash = crypto.createHmac('sha256', RAZORPAY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  
  if (hash !== signature) {
    return { error: 'Invalid signature' };
  }
  
  // Update Supabase payment status
  const { data } = await supabase
    .from('payments')
    .update({ status: 'COMPLETED', signature_verified: true })
    .eq('razorpay_order_id', orderId);
  
  return { success: true };
}
```

---

## Part 6: Network Security

### HTTPS Everywhere
- Frontend: Vercel (automatic HTTPS)
- Supabase: HTTPS only
- ESP32 → Supabase: HTTPS/TLS 1.2+

### TLS Certificates
- Vercel: Auto-managed by Let's Encrypt
- Supabase: Auto-managed by Let's Encrypt
- ESP32: Validate certificate (optional, depends on library)

### CORS Policies
```
Supabase CORS:
  - Allowed Origins: https://yourdomain.vercel.app
  - Methods: GET, POST, PUT, DELETE
  - Headers: Content-Type, Authorization
```

### API Rate Limiting
- 100 requests/minute per user
- 1000 requests/minute per IP
- Implemented by Supabase

---

## Part 7: Secrets Management

### Development
```bash
# frontend/.env.local (never commit)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (server-only)
RAZORPAY_SECRET=... (server-only)
```

### Production (Vercel)
1. Go to Project Settings → Environment Variables
2. Add as encrypted secrets:
   - SUPABASE_SERVICE_ROLE_KEY
   - RAZORPAY_SECRET
3. These are never exposed to client

### Firmware
```cpp
// firmware/esp32/src/config.h
#define SUPABASE_API_KEY "eyJ0eXAi..." // or read from EEPROM
#define WIFI_PASSWORD "..." // or read from NVS
#define RAZORPAY_SECRET "..." // NOT on ESP32 (server-side only)
```

**Best Practice**: Store in ESP32's encrypted NVS partition, not in code.

---

## Part 8: Threat Model

### Attacker: Eavesdropper (Network)

**Attack**: Intercept HTTP traffic  
**Mitigation**: 
- HTTPS on all endpoints
- TLS 1.2+
- Certificate pinning (optional, for ESP32)

**Risk**: LOW

---

### Attacker: Another User

**Attack**: Access other user's jobs/files  
**Mitigation**:
- RLS policies enforced on all queries
- Each user can only see own data
- JWT tokens signed by Supabase

**Risk**: LOW (if RLS policies are correct)

---

### Attacker: Physical Access to Kiosk

**Attack**: Extract ESP32 private keys, rewrite firmware  
**Mitigation**:
- Keep ESP32 sealed/tamper-evident
- Use read-protected flash
- Limit physical access to staff only

**Risk**: MEDIUM (depends on physical security)

---

### Attacker: Compromised Razorpay Account

**Attack**: Create fraudulent payments  
**Mitigation**:
- Verify signatures on all webhooks
- Only accept verified payments
- Monitor for unusual patterns

**Risk**: MEDIUM (Razorpay is PCI-DSS certified)

---

### Attacker: SQL Injection

**Attack**: Craft malicious JSON to SQL  
**Mitigation**:
- Parameterized queries (Supabase handles this)
- Input validation (ESP32 validates before sending)
- Never execute raw SQL from user input

**Risk**: LOW

---

### Attacker: Replay Attacks

**Attack**: Resend old API request  
**Mitigation**:
- JWT tokens are short-lived (1 hour)
- Razorpay signatures are one-time use
- Nonce/timestamp in UART protocol

**Risk**: LOW

---

## Part 9: Compliance

### GDPR (EU)
- ✅ Users can request data export
- ✅ Users can request deletion
- ✅ Data processed with consent
- ✅ Privacy policy provided

**Implementation**:
```sql
-- GDPR right to be forgotten
DELETE FROM print_jobs WHERE user_id = 'user-id';
DELETE FROM payments WHERE user_id = 'user-id';
DELETE FROM users WHERE id = 'user-id';
-- Cascading deletes handle related records
```

### CCPA (California)
- ✅ Users can request data access
- ✅ Users can request deletion
- ✅ No selling of personal data
- ✅ Privacy policy provided

### PCI DSS (Payment Card Industry)
- ✅ Use Razorpay (PCI-certified, we store no card data)
- ✅ HTTPS for all payment-related traffic
- ✅ No sensitive data in logs

### India (DPDP Act)
- ✅ Consent for data collection
- ✅ Privacy notice provided
- ✅ Data stored in compliance regions
- ✅ Right to erasure implemented

---

## Part 10: Incident Response

### Data Breach

**If ESP32 is stolen**:
1. Rotate service role key immediately
2. All subsequent API calls use new key
3. Old key is invalidated
4. Review access logs (available in Supabase)

**If Razorpay webhook is compromised**:
1. Verify all payment signatures
2. Check for fraudulent payments
3. Contact Razorpay support
4. Rotate webhook secret

**If Supabase account is compromised**:
1. Reset all user passwords (JWT tokens)
2. Rotate API keys
3. Review RLS policies
4. Check audit logs

### Recovery

1. **Immediate** (0-1 hour): Identify and contain
2. **Short-term** (1-24 hours): Notify affected users
3. **Medium-term** (1-7 days): Investigate root cause
4. **Long-term** (1+ months): Implement fixes, audit

---

## Part 11: Security Checklist

- [ ] All secrets stored in environment variables
- [ ] HTTPS enabled on all endpoints
- [ ] RLS policies tested (can't access other users' data)
- [ ] File deletion verified (cleanup job runs)
- [ ] Payment signatures verified on all webhooks
- [ ] ESP32 firmware not exposed to public
- [ ] Supabase RLS policies audited
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive data
- [ ] Logs don't contain PII or secrets
- [ ] Backups encrypted and tested
- [ ] Incident response plan documented

---

## Part 12: Additional Resources

- **Supabase Security**: https://supabase.com/docs/guides/auth
- **Razorpay Security**: https://razorpay.com/security/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **PCI DSS**: https://www.pcisecuritystandards.org/

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-29 | Initial security guide |

