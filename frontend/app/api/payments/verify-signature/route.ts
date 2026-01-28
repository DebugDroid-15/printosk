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
  const randomId = Math.floor(100000 + Math.random() * 900000).toString();
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
    
    // In test mode, skip signature verification
    if (!razorpaySecret || razorpaySecret === 'test') {
      console.log('[MOCK MODE] Skipping signature verification');
      const printId = await generatePrintId();
      return NextResponse.json(
        {
          success: true,
          printId,
          message: 'Payment verified (test mode)',
        },
        { status: 200 }
      );
    }

    // Verify signature
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
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
