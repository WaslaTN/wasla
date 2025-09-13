import { NextRequest, NextResponse } from 'next/server';

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentRef = searchParams.get('payment_ref');
  
  console.log('🔍 Payment webhook verification request for:', paymentRef);
  const centralServerUrl = `http://localhost:5000/api/v1/central-bookings/webhook/payment?payment_ref=${paymentRef}`;
  const centralServerResponse = await fetch(centralServerUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  const centralResult = await centralServerResponse.json();
  console.log('🔍 Central server response:', centralResult);

  if (!centralResult.success) {
    console.error('❌ Central server verification failed:', centralResult.error);
    return NextResponse.redirect(`${request.nextUrl.origin}/user/payment/failed?payment_ref=${paymentRef}`, { status: 302 });
  }

  console.log('✅ Central server verification successful');


  return NextResponse.redirect(`${request.nextUrl.origin}/user/payment/success?payment_ref=${paymentRef}`, { status: 302 });

}


