import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, eventType, message, timestamp } = body;

    // Validate required fields
    if (!bookingId || !eventType || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the event message (you can extend this to store in database, send SMS, etc.)
    console.log('🚨 Departure Event Message:', {
      bookingId,
      eventType,
      message,
      timestamp,
      receivedAt: new Date().toISOString()
    });

    // Here you can add additional logic like:
    // - Store in database
    // - Send SMS notification
    // - Send push notification to mobile app
    // - Send email notification
    // - Log to monitoring system

    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Event message received and processed',
      data: {
        bookingId,
        eventType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing event message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 