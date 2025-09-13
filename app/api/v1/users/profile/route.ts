import { NextRequest, NextResponse } from 'next/server';

const CENTRAL_SERVER_URL = process.env.CENTRAL_SERVER_URL || 'http://localhost:5000';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const authorization = request.headers.get('Authorization');
    
    const response = await fetch(`${CENTRAL_SERVER_URL}/api/v1/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Profile update API proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 