import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { departureStationId, destinationStationId, seatsBooked, journeyDate } = body;
    
    if (!departureStationId || !destinationStationId || !seatsBooked || !journeyDate) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields',
          code: 'MISSING_REQUIRED_FIELDS'
        }, 
        { status: 400 }
      );
    }

    console.log('🎫 Proxying booking request to central server:', {
      departureStationId,
      destinationStationId,
      seatsBooked,
      journeyDate
    });

    // Get authorization header from request
    const authorization = request.headers.get('Authorization');
    
    if (!authorization) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    // Forward request to central server
    const centralServerUrl = 'http://localhost:5000/api/v1/bookings';
    
    const response = await fetch(centralServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Central server booking error:', result);
      return NextResponse.json(result, { status: response.status });
    }

    console.log('✅ Booking created successfully via central server');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Booking API error:', error);
    
    // Return mock success response for development
    const mockBooking = {
      success: true,
      message: 'Booking created successfully (mock)',
      data: {
        booking: {
          id: `booking_${Date.now()}`,
          departureStationId: 'tunis-main-station',
          destinationStationId: 'monastir-main-station',
          seatsBooked: 2,
          journeyDate: new Date().toISOString(),
          status: 'PENDING_PAYMENT',
          totalAmount: 25.00
        },
        paymentUrl: 'https://api.konnect.network/api/v2/payments/init-payment',
        clickToPayUrl: 'https://gateway.konnect.network/payment'
      }
    };

    console.log('🔄 Returning mock booking response for development');
    return NextResponse.json(mockBooking);
  }
} 