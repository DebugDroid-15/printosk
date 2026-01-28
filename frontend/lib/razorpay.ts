/**
 * Razorpay Payment Integration
 * Handle payment initialization and verification
 */

interface RazorpayOrderOptions {
  amount: number; // in cents (e.g., 50000 = INR 500)
  currency?: string;
  receipt: string;
  description: string;
  customer_notify?: number;
}

/**
 * Initialize Razorpay order via backend API
 */
export async function createRazorpayOrder(
  amount: number,
  receipt: string,
  description: string
) {
  try {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        receipt,
        description,
        currency: process.env.NEXT_PUBLIC_CURRENCY || 'INR',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, order: data };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return { success: false, error };
  }
}

/**
 * Verify payment signature (called on client after payment modal closes)
 */
export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    const response = await fetch('/api/payments/verify-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error verifying signature:', error);
    return { success: false, error };
  }
}

/**
 * Load Razorpay checkout script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay payment modal
 */
export function openRazorpayCheckout(options: {
  orderId: string;
  amount: number;
  email: string;
  phone: string;
  onSuccess: (paymentId: string, signature: string) => void;
  onFailure: (error: any) => void;
}) {
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY;
  const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

  if (!razorpayKey) {
    throw new Error('Razorpay key not configured');
  }

  // In mock/test mode, simulate successful payment after 2 seconds
  if (mockMode || razorpayKey === 'test') {
    console.log('[MOCK MODE] Simulating payment completion in 2 seconds...');
    setTimeout(() => {
      const mockPaymentId = `pay_test_${Date.now()}`;
      const mockSignature = `sig_test_${Date.now()}`;
      options.onSuccess(mockPaymentId, mockSignature);
    }, 2000);
    return;
  }

  const RazorpayCheckout = (window as any).Razorpay;
  if (!RazorpayCheckout) {
    throw new Error('Razorpay script not loaded');
  }

  const checkoutObject = new RazorpayCheckout({
    key: razorpayKey,
    order_id: options.orderId,
    amount: options.amount,
    currency: process.env.NEXT_PUBLIC_CURRENCY || 'INR',
    name: 'Printosk',
    description: 'Print Job Payment',
    prefill: {
      email: options.email,
      contact: options.phone,
    },
    handler: function (response: any) {
      options.onSuccess(response.razorpay_payment_id, response.razorpay_signature);
    },
    modal: {
      ondismiss: function () {
        options.onFailure(new Error('Payment cancelled by user'));
      },
    },
  });

  checkoutObject.open();
}
