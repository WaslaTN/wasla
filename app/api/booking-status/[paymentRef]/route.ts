import { NextRequest, NextResponse } from 'next/server';

/**
 * Check booking status by payment reference
 * GET /api/booking-status/[paymentRef]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentRef: string }> }
) {
  try {
    const resolvedParams = await params;
    const { paymentRef } = resolvedParams;
    
    if (!paymentRef) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Payment reference is required' 
        }, 
        { status: 400 }
      );
    }

    console.log('🔍 Checking booking status for payment ref:', paymentRef);

    // Query Central Server for booking status
    const centralServerResponse = await fetch(`http://localhost:5000/api/v1/central-bookings/debug/payment/${paymentRef}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Wasla-Frontend-Status-Check/1.0'
      }
    });

    if (!centralServerResponse.ok) {
      throw new Error(`Central Server responded with status ${centralServerResponse.status}`);
    }

    const result = await centralServerResponse.json();
    
    if (result.success && result.data.booking) {
      const booking = result.data.booking;
      
      return NextResponse.json({
        success: true,
        message: 'Booking status retrieved successfully',
        data: {
          paymentRef: paymentRef,
          bookingId: booking.id,
          verificationCode: booking.verificationCode,
          status: booking.status,
          totalAmount: booking.totalAmount,
          seatsBooked: booking.seatsBooked,
          departureStationId: booking.departureStationId,
          destinationStationId: booking.destinationStationId,
          createdAt: booking.createdAt,
          paymentProcessedAt: booking.paymentProcessedAt,
          user: booking.user,
          isPaid: booking.status === 'PAID',
          isPending: booking.status === 'PENDING',
          isFailed: booking.status === 'FAILED'
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found',
          paymentRef: paymentRef
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ Error checking booking status:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check booking status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
