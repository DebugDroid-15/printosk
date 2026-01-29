/**
 * Printosk Kiosk API - Fetch Print Job
 * GET /api/kiosk/print-job/:id
 * 
 * Fetches print job details for a given Print ID
 * Used by ESP32 kiosk to retrieve documents for printing
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const printId = params.id;
    
    console.log(`[Kiosk API] Fetching print job: ${printId}`);

    // Get print job details
    const { data: printJob, error: jobError } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('print_id_numeric', parseInt(printId))
      .single();

    if (jobError || !printJob) {
      console.error('[Kiosk API] Print job not found:', jobError);
      return NextResponse.json(
        { success: false, error: 'Print job not found' },
        { status: 404 }
      );
    }

    // Check if job has expired (24 hours)
    const expiresAt = new Date(printJob.expires_at);
    if (new Date() > expiresAt) {
      console.error('[Kiosk API] Print job has expired');
      return NextResponse.json(
        { success: false, error: 'Print job has expired' },
        { status: 410 }
      );
    }

    // Get files associated with this job
    const { data: files, error: filesError } = await supabase
      .from('print_files')
      .select('*')
      .eq('job_id', printJob.id)
      .order('created_at', { ascending: true });

    if (filesError) {
      console.error('[Kiosk API] Error fetching files:', filesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch files' },
        { status: 500 }
      );
    }

    // Return job details without sensitive information
    return NextResponse.json(
      {
        success: true,
        printJob: {
          id: printJob.id,
          print_id_numeric: printJob.print_id_numeric,
          email: printJob.email,
          status: printJob.status,
          payment_status: printJob.payment_status,
          file_count: printJob.file_count,
          color_mode: printJob.color_mode,
          paper_size: printJob.paper_size,
          duplex_mode: printJob.duplex_mode,
          copies: printJob.copies,
          total_amount: printJob.total_amount,
          created_at: printJob.created_at,
        },
        files: files?.map(f => ({
          id: f.id,
          file_name: f.file_name,
          file_size: f.file_size,
          file_type: f.file_type,
          page_count: f.page_count,
        })) || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Kiosk API] Error fetching print job:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
