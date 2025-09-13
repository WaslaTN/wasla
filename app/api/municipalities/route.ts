import { NextRequest, NextResponse } from 'next/server'

const TUNISIA_API_BASE = 'https://tn-municipality-api.vercel.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const delegation = searchParams.get('delegation')
    const postalCode = searchParams.get('postalCode')
    
    // Build query parameters
    const params = new URLSearchParams()
    if (name) params.append('name', name)
    if (delegation) params.append('delegation', delegation)
    if (postalCode) params.append('postalCode', postalCode)
    
    const queryString = params.toString()
    const url = `${TUNISIA_API_BASE}/api/municipalities${queryString ? `?${queryString}` : ''}`
    
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
    console.error('Error fetching municipalities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch municipalities' },
      { status: 500 }
    )
  }
}
