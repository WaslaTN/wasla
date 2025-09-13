import { NextRequest, NextResponse } from 'next/server'
import { StationPartnershipService } from '@/lib/station-partnership'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      cin,
      governorate,
      delegation,
      latitude,
      longitude
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber || !cin || !governorate || !delegation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate request number
    const requestNumber = StationPartnershipService.generateRequestNumber()

    // Create the request
    const request = await StationPartnershipService.createRequest({
      request_number: requestNumber,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phoneNumber,
      cin: cin,
      governorate: governorate,
      delegation: delegation,
      latitude: latitude,
      longitude: longitude
    })

    return NextResponse.json({
      success: true,
      requestNumber: request.request_number,
      data: request
    })
  } catch (error) {
    console.error('Error creating station partnership request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const requestNumber = searchParams.get('requestNumber')

    if (!requestNumber) {
      return NextResponse.json(
        { error: 'Request number is required' },
        { status: 400 }
      )
    }

    const requestData = await StationPartnershipService.getRequestByNumber(requestNumber)

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: requestData
    })
  } catch (error) {
    console.error('Error fetching station partnership request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
