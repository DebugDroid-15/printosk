/**
 * Printosk API - Verify Payment Signature
 * POST /api/payments/verify-signature
 * 
 * Verifies the Razorpay payment signature and creates print job
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

interface VerifyRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  email: string;
  phone?: string;
  files: Array<{ name: string; size: number }>;
  settings: {
    colorMode: 'color' | 'bw';
    copies: number;
    paperSize: 'a4' | 'letter' | 'a3';
    duplex: boolean;
  };
}

// Helper function to generate unique 6-digit Print ID
async function generatePrintId(): Promise<number> {
  const randomId = Math.floor(100000 + Math.random() * 900000);
  return randomId;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();

    // Validate input
    if (!body.orderId || !body.paymentId || !body.signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    const razorpaySecret = process.env.RAZORPAY_SECRET;
    const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    
    // In test mode, skip signature verification
    if (mockMode || !razorpaySecret || razorpaySecret === 'test') {
      console.log('[MOCK MODE] Skipping signature verification');
      const printId = await generatePrintId();
      
      // Save to Supabase even in mock mode
      try {
        // Create user if doesn't exist
        await supabase
          .from('users')
          .upsert({
            email: body.email,
            phone_number: body.phone,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });

        // Create print job
        const jobResult = await supabase
          .from('print_jobs')
          .insert([{
            print_id_numeric: printId,
            email: body.email,
            status: 'PENDING',
            payment_status: 'COMPLETED',
            file_count: body.files.length,
            color_mode: body.settings.colorMode === 'color' ? 'COLOR' : 'GRAYSCALE',
            paper_size: body.settings.paperSize.toUpperCase(),
            duplex_mode: body.settings.duplex ? 'LONG_EDGE' : 'NONE',
            copies: body.settings.copies,
            total_amount: 0, // You can calculate this based on file count and settings
            currency: 'INR',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }])
          .select()
          .single();

        if (jobResult.data?.id) {
          // Record payment
          await supabase
            .from('payment_records')
            .insert([{
              job_id: jobResult.data.id,
              order_id: body.orderId,
              payment_id: body.paymentId,
              amount: 0,
              currency: 'INR',
              status: 'COMPLETED',
              created_at: new Date().toISOString(),
            }]);

          console.log('[MOCK MODE] Print job created:', { printId, email: body.email });
        }
      } catch (dbError) {
        console.error('Database error in mock mode:', dbError);
        // Continue anyway - don't fail in mock mode
      }

      return NextResponse.json(
        {
          success: true,
          printId,
          message: 'Payment verified (test mode)',
        },
        { status: 200 }
      );
    }

    // Verify signature in production
    const shasum = crypto.createHmac('sha256', razorpaySecret);
    shasum.update(`${body.orderId}|${body.paymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== body.signature) {
      console.error('Invalid payment signature');
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Generate unique Print ID
    const printId = await generatePrintId();

    try {
      // Create user if doesn't exist
      await supabase
        .from('users')
        .upsert({
          email: body.email,
          phone_number: body.phone,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      // Create print job
      const jobResult = await supabase
        .from('print_jobs')
        .insert([{
          print_id_numeric: printId,
          email: body.email,
          status: 'PENDING',
          payment_status: 'COMPLETED',
          file_count: body.files.length,
          color_mode: body.settings.colorMode === 'color' ? 'COLOR' : 'GRAYSCALE',
          paper_size: body.settings.paperSize.toUpperCase(),
          duplex_mode: body.settings.duplex ? 'LONG_EDGE' : 'NONE',
          copies: body.settings.copies,
          total_amount: 0,
          currency: 'INR',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }])
        .select()
        .single();

      if (jobResult.data?.id) {
        // Record payment
        await supabase
          .from('payment_records')
          .insert([{
            job_id: jobResult.data.id,
            order_id: body.orderId,
            payment_id: body.paymentId,
            amount: 0,
            currency: 'INR',
            status: 'COMPLETED',
            created_at: new Date().toISOString(),
          }]);
      }

      console.log('Payment verified successfully', {
        orderId: body.orderId,
        paymentId: body.paymentId,
        email: body.email,
        printId,
        filesCount: body.files.length,
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Still return success for payment - log it anyway
    }

    return NextResponse.json(
      {
        success: true,
        printId,
        message: 'Payment verified and print job created',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
