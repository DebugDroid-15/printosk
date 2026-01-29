/**
 * Printosk Kiosk API - Download Print File
 * GET /api/kiosk/print-job/:id/download-file
 * 
 * Downloads the actual file for printing from Supabase Storage
 * Called by ESP32 kiosk to retrieve document
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const printId = params.id;
    const fileIndex = request.nextUrl.searchParams.get('fileIndex') || '0';

    console.log(`[Kiosk API] Downloading file for print job ${printId}, index ${fileIndex}`);

    // Get print job
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

    // Get files for this job
    const { data: files, error: filesError } = await supabase
      .from('print_files')
      .select('*')
      .eq('job_id', printJob.id)
      .order('created_at', { ascending: true });

    if (filesError || !files || files.length === 0) {
      console.error('[Kiosk API] No files found for job:', filesError);
      return NextResponse.json(
        { success: false, error: 'No files found for this job' },
        { status: 404 }
      );
    }

    const fileIndex_num = parseInt(fileIndex);
    if (fileIndex_num < 0 || fileIndex_num >= files.length) {
      return NextResponse.json(
        { success: false, error: 'File index out of range' },
        { status: 400 }
      );
    }

    const file = files[fileIndex_num];
    const storagePath = file.storage_path || `jobs/${printJob.id}/${file.file_name}`;

    console.log(`[Kiosk API] Fetching file from storage: ${storagePath}`);

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('print-files')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('[Kiosk API] Error downloading file:', downloadError);
      return NextResponse.json(
        { success: false, error: 'Failed to download file' },
        { status: 500 }
      );
    }

    // Convert to base64 for transmission
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    console.log(`[Kiosk API] Successfully downloaded file: ${file.file_name} (${buffer.length} bytes)`);

    return NextResponse.json(
      {
        success: true,
        file: {
          name: file.file_name,
          type: file.file_type,
          size: file.file_size,
          pageCount: file.page_count,
          data: base64,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Kiosk API] Error downloading file:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
