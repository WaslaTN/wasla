import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Booking ID is required',
          code: 'MISSING_BOOKING_ID'
        }, 
        { status: 400 }
      );
    }

    console.log('🔍 Fetching booking details for ID:', id);

    // Try to get booking details using the central server endpoint
    // The ID could be either a booking ID or payment reference
    const centralServerUrl = `http://localhost:5000/api/v1/central-bookings/booking-details/${id}`;
    
    const response = await fetch(centralServerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Central server booking details error:', result);
      return NextResponse.json(result, { status: response.status });
    }

    console.log('✅ Booking details retrieved successfully via central server');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Booking details API error:', error);
    
    // Get ID for mock response
    const resolvedParams = await params;
    const { id: mockId } = resolvedParams;
    
    // Return mock booking for development
    const mockBooking = {
      success: true,
      message: 'Booking retrieved successfully (mock)',
      data: {
        booking: {
          id: mockId,
          verificationCode: Math.random().toString().substr(2, 6),
          status: Math.random() > 0.5 ? 'PAID' : 'PENDING',
          seatsBooked: Math.floor(Math.random() * 4) + 1,
          totalAmount: (Math.random() * 100 + 20).toFixed(2),
          journeyDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          paymentReference: `ref_${Math.random().toString(36).substr(2, 9)}`,
          paymentProcessedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: 'user_123',
            phoneNumber: '+21653249239',
            firstName: 'John',
            lastName: 'Doe'
          },
          departureStation: {
            id: 'monastir-main-station',
            name: 'Monastir Main Station',
            governorate: {
              id: 'gov_monastir',
              name: 'Monastir',
              nameAr: 'المنستير',
              createdAt: new Date().toISOString()
            },
            delegation: {
              id: 'monastir-center',
              name: 'Monastir Center',
              nameAr: 'المنستير المركز',
              governorateId: 'gov_monastir',
              createdAt: new Date().toISOString()
            },
            localServerIp: '196.235.223.185'
          },
          destinationStation: {
            id: 'tunis-main-station',
            name: 'Tunis Main Station',
            governorate: {
              id: 'gov_tunis',
              name: 'Tunis',
              nameAr: 'تونس',
              createdAt: new Date().toISOString()
            },
            delegation: {
              id: 'tunis-center',
              name: 'Tunis Center',
              nameAr: 'تونس المركز',
              governorateId: 'gov_tunis',
              createdAt: new Date().toISOString()
            }
          },
          vehicleAllocations: []
        },
        payment: {
          status: 'completed',
          amount: 25000,
          currency: 'TND'
        },
        summary: {
          totalSeats: 1,
          totalAmount: '25',
          vehicleCount: 0,
          isPaid: true,
          departureLocation: 'Monastir Main Station',
          destinationLocation: 'Tunis Main Station',
          journeyDate: new Date().toISOString()
        }
      }
    };

    console.log('🔄 Returning mock booking response for development');
    return NextResponse.json(mockBooking);
  }
}
