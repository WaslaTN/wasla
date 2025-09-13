import { NextRequest, NextResponse } from 'next/server'
import { StationPartnershipService } from '@/lib/station-partnership'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    const requestNumber = formData.get('requestNumber') as string
    const frontImage = formData.get('frontImage') as File
    const backImage = formData.get('backImage') as File

    if (!requestNumber || !frontImage || !backImage) {
      return NextResponse.json(
        { error: 'Missing required fields: requestNumber, frontImage, backImage' },
        { status: 400 }
      )
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    if (!allowedTypes.includes(frontImage.type) || !allowedTypes.includes(backImage.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file sizes (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    if (frontImage.size > maxSize || backImage.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB per file.' },
        { status: 400 }
      )
    }

    // Upload images to Supabase
    const { frontUrl, backUrl } = await StationPartnershipService.uploadCinImages(
      requestNumber,
      frontImage,
      backImage
    )

    return NextResponse.json({
      success: true,
      frontUrl,
      backUrl
    })
  } catch (error) {
    console.error('Error uploading CIN images:', error)
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    )
  }
}
