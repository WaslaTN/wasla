import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
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

    console.log('🕒 Proxying recent activity request to central server');

    // Forward request to central server with limit for recent items
    const centralServerUrl = 'http://localhost:5000/api/v1/bookings?limit=5&recent=true';
    
    const response = await fetch(centralServerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Central server recent activity error:', result);
      return NextResponse.json(result, { status: response.status });
    }

    console.log('✅ Recent activity retrieved successfully via central server');
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Recent activity API error:', error);
    
    // Return mock recent activity for development
    const mockRecentActivity = {
      success: true,
      message: 'Recent activity retrieved successfully (mock)',
      data: {
        bookings: [
          {
            id: 'booking_recent_1',
            verificationCode: 'ABC123',
            status: 'PAID',
            seatsBooked: 2,
            totalAmount: 25.00,
            journeyDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            paymentReference: 'pay_12345',
            paymentProcessedAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
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
            id: 'booking_recent_2',
            verificationCode: 'XYZ789',
            status: 'PENDING',
            seatsBooked: 1,
            totalAmount: 15.00,
            journeyDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            paymentReference: 'pay_67890',
            paymentProcessedAt: null,
            createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            departureStation: {
              id: 'monastir-main-station',
              name: 'Monastir Main Station',
              governorate: 'Monastir',
              delegation: 'Monastir'
            },
            destinationStation: {
              id: 'tunis-main-station',
              name: 'Tunis Main Station',
              governorate: 'Tunis',
              delegation: 'Tunis'
            }
          },
          {
            id: 'booking_recent_3',
            verificationCode: 'DEF456',
            status: 'PAID',
            seatsBooked: 3,
            totalAmount: 45.00,
            journeyDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (completed)
            paymentReference: 'pay_11111',
            paymentProcessedAt: new Date(Date.now() - 90000000).toISOString(),
            createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            departureStation: {
              id: 'tunis-main-station',
              name: 'Tunis Main Station',
              governorate: 'Tunis',
              delegation: 'Tunis'
            },
            destinationStation: {
              id: 'sfax-main-station',
              name: 'Sfax Main Station',
              governorate: 'Sfax',
              delegation: 'Sfax'
            }
          }
        ]
      }
    };

    console.log('🔄 Returning mock recent activity for development');
    return NextResponse.json(mockRecentActivity);
  }
} 