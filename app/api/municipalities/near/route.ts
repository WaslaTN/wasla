import { NextRequest, NextResponse } from 'next/server'

const TUNISIA_API_BASE = 'https://tn-municipality-api.vercel.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '5000'
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'lat and lng parameters are required' },
        { status: 400 }
      )
    }
    
    const url = `${TUNISIA_API_BASE}/api/municipalities/near?lat=${lat}&lng=${lng}&radius=${radius}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Tunisia API responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching nearby municipalities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby municipalities' },
      { status: 500 }
    )
  }
}
