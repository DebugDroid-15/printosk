/**
 * Printosk API - Razorpay Webhook Handler
 * POST /api/payments/webhook
 * 
 * Handles Razorpay payment webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle webhook events
    const event = body.event;
    const payload = body.payload;

    console.log(`Webhook received: ${event}`, {
      orderId: payload?.order?.entity?.id,
      paymentId: payload?.payment?.entity?.id,
      status: payload?.payment?.entity?.status,
    });

    switch (event) {
      case 'payment.authorized':
        // Payment authorized - mark as completed
        // TODO: Update print job status to PENDING in Supabase
        console.log('Payment authorized:', payload.payment.entity.id);
        break;

      case 'payment.failed':
        // Payment failed - update job status
        // TODO: Update print job status to FAILED in Supabase
        console.log('Payment failed:', payload.payment.entity.id);
        break;

      case 'payment.captured':
        // Payment captured
        console.log('Payment captured:', payload.payment.entity.id);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json(
      { success: true, message: 'Webhook processed' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
