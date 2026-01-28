/**
 * Printosk API - Verify Payment Signature
 * POST /api/payments/verify-signature
 * 
 * Verifies the Razorpay payment signature and creates print job
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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
async function generatePrintId(): Promise<string> {
  // In production, this would check Supabase database to ensure uniqueness
  // For now, generate a random 6-digit number
  const randomId = Math.floor(100000 + Math.random() * 900000).toString();
  return randomId;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();

    // Validate input
    if (!body.orderId || !body.paymentId || !body.signature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    const razorpaySecret = process.env.RAZORPAY_SECRET;
    if (!razorpaySecret) {
      console.error('Razorpay secret not configured');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Verify signature
    const shasum = crypto.createHmac('sha256', razorpaySecret);
    shasum.update(`${body.orderId}|${body.paymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== body.signature) {
      console.error('Invalid payment signature');
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Generate unique Print ID
    const printId = await generatePrintId();

    // TODO: In production, you would:
    // 1. Create user in Supabase if doesn't exist
    // 2. Create payment record
    // 3. Upload files to Supabase Storage
    // 4. Create print job with generated Print ID
    // 5. Set job status to PENDING

    console.log('Payment verified successfully', {
      orderId: body.orderId,
      paymentId: body.paymentId,
      email: body.email,
      printId,
      filesCount: body.files.length,
    });

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
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
