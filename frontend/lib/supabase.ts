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
      .select('*, print_files(*, users(*))')
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
 * Get print job status
 */
export async function getJobStatus(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('print_jobs')
      .select('status, status_message, updated_at')
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
