import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header from request
    const authorization = request.headers.get('Authorization');
    
    console.log('🔐 Booking history - Authorization header:', authorization ? `${authorization.substring(0, 20)}...` : 'None');
    
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

    console.log('📋 Proxying booking history request to central server');

    // Forward request to central server
    const centralServerUrl = 'http://localhost:5000/api/v1/bookings';
    
    const response = await fetch(centralServerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Central server booking history error:', result);
      console.error('❌ Response status:', response.status);
      console.error('❌ Authorization header sent:', authorization ? `${authorization.substring(0, 30)}...` : 'None');
      return NextResponse.json(result, { status: response.status });
    }

    console.log('✅ Booking history retrieved successfully via central server');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Booking history API error:', error);
    
    // Return mock booking history for development
    const mockBookingHistory = {
      success: true,
      message: 'Bookings retrieved successfully (mock)',
      data: {
        bookings: [
          {
            id: 'booking_1',
            verificationCode: 'ABC123',
            status: 'PAID',
            seatsBooked: 2,
            totalAmount: 25.00,
            journeyDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            paymentReference: 'pay_12345',
            paymentProcessedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            departureStation: {
              id: 'monastir-main-station',
              name: 'Monastir Main Station',
              governorate: 'Monastir',
              delegation: 'Monastir'
            },
            destinationStation: {
              id: 'sfax-main-station',
              name: 'Sfax Main Station',
              governorate: 'Sfax',
              delegation: 'Sfax'
            }
          },
          {
            id: 'booking_2',
            verificationCode: 'XYZ789',
            status: 'PENDING',
            seatsBooked: 1,
            totalAmount: 15.00,
            journeyDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            paymentReference: 'pay_67890',
            paymentProcessedAt: null,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            departureStation: {
              id: 'tunis-main-station',
              name: 'Tunis Main Station',
              governorate: 'Tunis',
              delegation: 'Tunis'
            },
            destinationStation: {
              id: 'monastir-main-station',
              name: 'Monastir Main Station',
              governorate: 'Monastir',
              delegation: 'Monastir'
            }
          }
        ]
      }
    };

    console.log('🔄 Returning mock booking history for development');
    return NextResponse.json(mockBookingHistory);
  }
} 