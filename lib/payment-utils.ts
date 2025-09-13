/**
 * Payment utilities for handling Konnect payment flows
 */

export interface PaymentStatus {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentRef: string;
  bookingId?: string;
  amount?: number;
  message?: string;
}

export interface PaymentWebhookData {
  payment_status: string;
  order_id: string;
  payment_id: string;
  amount: number;
  gateway_response: any;
}

/**
 * Check payment status by payment reference
 */
export async function checkPaymentStatus(paymentRef: string): Promise<PaymentStatus> {
  try {
    const response = await fetch(`/api/bookings/payment/${paymentRef}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        status: mapPaymentStatus(result.data.booking?.status || result.data.payment?.status),
        paymentRef,
        bookingId: result.data.booking?.id,
        amount: result.data.booking?.totalAmount,
        message: result.message
      };
    } else {
      return {
        success: false,
        status: 'failed',
        paymentRef,
        message: result.message || 'Failed to check payment status'
      };
    }
  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    return {
      success: false,
      status: 'failed',
      paymentRef,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Map various payment status formats to our standard format
 */
function mapPaymentStatus(status: string): PaymentStatus['status'] {
  const normalizedStatus = status?.toLowerCase();
  
  switch (normalizedStatus) {
    case 'paid':
    case 'completed':
    case 'success':
    case 'successful':
      return 'completed';
    
    case 'pending':
    case 'processing':
    case 'created':
      return 'pending';
    
    case 'failed':
    case 'error':
    case 'declined':
      return 'failed';
    
    case 'cancelled':
    case 'canceled':
    case 'expired':
      return 'cancelled';
    
    default:
      return 'pending';
  }
}

/**
 * Handle successful payment completion
 */
export async function handlePaymentSuccess(paymentRef: string) {
  try {
    console.log('🎉 Payment successful, processing completion for:', paymentRef);
    
    // The webhook should have already updated the servers
    // Here we can add any frontend-specific completion logic
    
    // Redirect to booking confirmation page
    window.location.href = `/booking-confirmation?payment_ref=${paymentRef}`;
    
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    // Still redirect to confirmation page, let it handle any errors
    window.location.href = `/booking-confirmation?payment_ref=${paymentRef}`;
  }
}

/**
 * Handle payment failure
 */
export async function handlePaymentFailure(paymentRef: string, reason?: string) {
  try {
    console.log('❌ Payment failed for:', paymentRef, reason);
    
    // Redirect to booking page with error
    const errorParam = reason ? `&error=${encodeURIComponent(reason)}` : '';
    window.location.href = `/book-trip?payment_failed=true&payment_ref=${paymentRef}${errorParam}`;
    
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    window.location.href = `/book-trip?payment_failed=true`;
  }
}

/**
 * Process webhook data and update booking status
 */
export async function processPaymentWebhook(webhookData: PaymentWebhookData, paymentRef: string) {
  const { payment_status } = webhookData;
  
  switch (payment_status?.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'successful':
      await handlePaymentSuccess(paymentRef);
      break;
      
    case 'failed':
    case 'declined':
    case 'error':
      await handlePaymentFailure(paymentRef, 'Payment was declined');
      break;
      
    case 'cancelled':
    case 'canceled':
      await handlePaymentFailure(paymentRef, 'Payment was cancelled');
      break;
      
    default:
      console.log('⏳ Payment status is pending or unknown:', payment_status);
      // For pending payments, we might want to poll for updates
      break;
  }
}

/**
 * Start polling for payment status updates (for cases where webhook might be delayed)
 */
export function startPaymentStatusPolling(paymentRef: string, intervalMs: number = 5000, maxAttempts: number = 24) {
  let attempts = 0;
  
  const pollInterval = setInterval(async () => {
    attempts++;
    
    try {
      const status = await checkPaymentStatus(paymentRef);
      
      if (status.status === 'completed') {
        clearInterval(pollInterval);
        await handlePaymentSuccess(paymentRef);
      } else if (status.status === 'failed' || status.status === 'cancelled') {
        clearInterval(pollInterval);
        await handlePaymentFailure(paymentRef, status.message);
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        console.log('⏰ Payment status polling timeout for:', paymentRef);
        // Don't redirect on timeout, let user check manually
      }
    } catch (error) {
      console.error('❌ Error during payment status polling:', error);
      
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
      }
    }
  }, intervalMs);
  
  return pollInterval;
}
