/**
 * Printosk API - Create Razorpay Payment Order
 * POST /api/payments/create-order
 * 
 * Creates a Razorpay order for the print job
 */

import { NextRequest, NextResponse } from 'next/server';

interface CreateOrderRequest {
  amount: number; // in paise
  receipt: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate input
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }
    if (!body.receipt || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Razorpay credentials
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY;
    const razorpaySecret = process.env.RAZORPAY_SECRET;

    if (!razorpayKeyId || !razorpaySecret || razorpayKeyId === 'test' || razorpaySecret === 'test') {
      // Return mock response in test mode
      console.log('[MOCK MODE] Creating test order');
      return NextResponse.json(
        {
          id: `order_test_${Date.now()}`,
          amount: body.amount,
          currency: 'INR',
          status: 'created',
        },
        { status: 200 }
      );
    }

    // Create order via Razorpay API
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: body.amount,
        currency: 'INR',
        receipt: body.receipt,
        description: body.description,
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('Razorpay error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    const order = await orderResponse.json();

    return NextResponse.json(
      {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
