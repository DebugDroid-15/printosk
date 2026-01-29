/**
 * Printosk Kiosk API - Update Print Job Status
 * PUT /api/kiosk/print-job/:id/status
 * 
 * Updates print job status after printing
 * Called by ESP32 kiosk when job completes or encounters errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface StatusUpdateRequest {
  status: 'PRINTING' | 'COMPLETED' | 'ERROR' | 'PENDING';
  error_message?: string;
  pages_printed?: number;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const printId = params.id;
    const body: StatusUpdateRequest = await request.json();

    console.log(`[Kiosk API] Updating print job ${printId} status:`, body.status);

    // Validate status
    const validStatuses = ['PRINTING', 'COMPLETED', 'ERROR', 'PENDING'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

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

    // Build update object
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (body.error_message && body.status === 'ERROR') {
      updateData.error_message = body.error_message;
    }

    if (body.pages_printed) {
      updateData.pages_printed = body.pages_printed;
    }

    // Update print job
    const { error: updateError } = await supabase
      .from('print_jobs')
      .update(updateData)
      .eq('id', printJob.id);

    if (updateError) {
      console.error('[Kiosk API] Error updating print job:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert([{
        job_id: printJob.id,
        action: `Print ${body.status}`,
        details: body.error_message || `Job ${body.status}`,
        timestamp: new Date().toISOString(),
      }]);

    console.log(`[Kiosk API] Successfully updated print job ${printId} to ${body.status}`);

    return NextResponse.json(
      {
        success: true,
        message: `Print job status updated to ${body.status}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Kiosk API] Error updating print job status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
