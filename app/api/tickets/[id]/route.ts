import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ticket ID is required' 
        },
        { status: 400 }
      );
    }

    console.log('🎫 Fetching ticket details for ID:', id);

    // Try to get ticket details from Central Server
    // First try by booking ID, then by payment reference
    let centralServerUrl = `http://localhost:5000/api/v1/central-bookings/booking-details/${id}`;
    
    let response = await fetch(centralServerUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // If not found by payment reference, try the debug endpoint for booking lookup
    if (!response.ok && response.status === 404) {
      console.log('🔍 Trying debug payment lookup...');
      centralServerUrl = `http://localhost:5000/api/v1/central-bookings/debug/payment/${id}`;
      
      response = await fetch(centralServerUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to fetch ticket details from Central Server:', result);
      return NextResponse.json(
        {
          success: false,
          message: 'Ticket not found',
          error: result.message || 'Unknown error'
        },
        { status: response.status }
      );
    }

    console.log('✅ Ticket details fetched successfully');
    
    // Return the data in a consistent format
    return NextResponse.json({
      success: true,
      data: {
        ticket: result.data?.booking || result.data,
        booking: result.data?.booking || result.data,
        payment: result.data?.payment,
        summary: result.data?.summary
      },
      message: 'Ticket details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching ticket details:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
