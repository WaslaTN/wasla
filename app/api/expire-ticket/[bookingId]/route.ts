import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Get the central server URL from environment variables
    const centralServerUrl = process.env.CENTRAL_SERVER_URL || 'http://localhost:3000';
    
    // Forward the request to the central server
    const response = await fetch(`${centralServerUrl}/api/v1/central-bookings/expire-ticket/${bookingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to expire ticket' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error in expire ticket proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 