import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch print job by numeric Print ID
 * Called when user enters PIN at kiosk
 */
export async function fetchJobByPrintId(printId: string) {
  try {
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*, print_files(*)')
      .eq('print_id_numeric', parseInt(printId, 10))
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching job:', error);
    return { success: false, error };
  }
}

/**
 * Fetch print job by email
 */
export async function fetchJobsByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*, print_files(*)')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching jobs by email:', error);
    return { success: false, error };
  }
}

/**
 * Get print job status
 */
export async function getJobStatus(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('print_jobs')
      .select('status, status_message, updated_at, payment_status')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting job status:', error);
    return { success: false, error };
  }
}

/**
 * Create a new print job
 */
export async function createPrintJob(jobData: {
  print_id_numeric: number;
  email: string;
  file_count: number;
  color_mode?: string;
  paper_size?: string;
  duplex_mode?: string;
  copies?: number;
  total_amount: number;
}) {
  try {
    const { data, error } = await supabase
      .from('print_jobs')
      .insert([{
        ...jobData,
        status: 'PENDING',
        payment_status: 'PENDING',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating print job:', error);
    return { success: false, error };
  }
}

/**
 * Update print job status
 */
export async function updateJobStatus(
  jobId: string,
  status: string,
  statusMessage?: string
) {
  try {
    const { data, error } = await supabase
      .from('print_jobs')
      .update({
        status,
        status_message: statusMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating job status:', error);
    return { success: false, error };
  }
}

/**
 * Create a new user
 */
export async function createUser(email: string, phoneNumber?: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          email,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error };
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  jobId: string
): Promise<{ success: boolean; path?: string; error?: any }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${jobId}-${Date.now()}.${fileExt}`;
    const filePath = `jobs/${jobId}/${fileName}`;

    const { error } = await supabase.storage
      .from('print-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error };
  }
}

/**
 * Record payment in database
 */
export async function recordPayment(paymentData: {
  job_id: string;
  order_id: string;
  payment_id: string;
  amount: number;
  status: string;
  razorpay_signature?: string;
  razorpay_response?: any;
}) {
  try {
    const { data, error } = await supabase
      .from('payment_records')
      .insert([{
        ...paymentData,
        currency: 'INR',
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { success: false, error };
  }
}

/**
 * Log activity
 */
export async function logActivity(
  jobId: string,
  action: string,
  details?: any
) {
  try {
    await supabase
      .from('activity_logs')
      .insert([{
        job_id: jobId,
        action,
        details: details || {},
        created_at: new Date().toISOString(),
      }]);
    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error };
  }
}
