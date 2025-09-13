import { NextRequest, NextResponse } from 'next/server'
import { StationPartnershipService } from '@/lib/station-partnership'

export async function GET(req: NextRequest) {
  try {
    // Get all requests for admin view
    const requests = await StationPartnershipService.getAllRequests()
    
    return NextResponse.json({
      success: true,
      data: requests
    })
  } catch (error) {
    console.error('Error fetching station partnership requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { requestNumber, status, rejectionReason } = body

    if (!requestNumber || !status) {
      return NextResponse.json(
        { error: 'Request number and status are required' },
        { status: 400 }
      )
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      )
    }

    // Validate rejection reason for rejected requests
    if (status === 'rejected' && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a request' },
        { status: 400 }
      )
    }

    // Update the request status
    const updatedRequest = await StationPartnershipService.updateRequestStatus(
      requestNumber, 
      status, 
      rejectionReason
    )

    return NextResponse.json({
      success: true,
      data: updatedRequest
    })
  } catch (error) {
    console.error('Error updating station partnership request status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 