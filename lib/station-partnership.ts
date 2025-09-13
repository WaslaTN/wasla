import { supabase, StationPartnershipRequest, TABLES, BUCKETS } from './supabase'

export class StationPartnershipService {
  // Generate a unique request number
  static generateRequestNumber(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `SPR-${timestamp}-${random}`
  }

  // Upload CIN images to Supabase storage
  static async uploadCinImages(requestNumber: string, frontImage: File, backImage: File) {
    try {
      const folderPath = `${requestNumber}`
      
      // Upload front image
      const frontFileName = `${folderPath}/cin_front.${frontImage.name.split('.').pop()}`
      const { data: frontData, error: frontError } = await supabase.storage
        .from(BUCKETS.STATION_DOCUMENTS)
        .upload(frontFileName, frontImage, {
          cacheControl: '3600',
          upsert: true
        })

      if (frontError) throw frontError

      // Upload back image
      const backFileName = `${folderPath}/cin_back.${backImage.name.split('.').pop()}`
      const { data: backData, error: backError } = await supabase.storage
        .from(BUCKETS.STATION_DOCUMENTS)
        .upload(backFileName, backImage, {
          cacheControl: '3600',
          upsert: true
        })

      if (backError) throw backError

      // Get public URLs
      const { data: frontUrlData } = supabase.storage
        .from(BUCKETS.STATION_DOCUMENTS)
        .getPublicUrl(frontFileName)

      const { data: backUrlData } = supabase.storage
        .from(BUCKETS.STATION_DOCUMENTS)
        .getPublicUrl(backFileName)

      return {
        frontUrl: frontUrlData.publicUrl,
        backUrl: backUrlData.publicUrl
      }
    } catch (error) {
      console.error('Error uploading CIN images:', error)
      throw error
    }
  }

  // Create a new station partnership request
  static async createRequest(request: Omit<StationPartnershipRequest, 'id' | 'created_at' | 'updated_at' | 'status'>) {
    try {
      const { data, error } = await supabase
        .from(TABLES.STATION_PARTNERSHIP_REQUESTS)
        .insert([{
          ...request,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating station partnership request:', error)
      throw error
    }
  }

  // Get request by request number
  static async getRequestByNumber(requestNumber: string): Promise<StationPartnershipRequest | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.STATION_PARTNERSHIP_REQUESTS)
        .select('*')
        .eq('request_number', requestNumber)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Error fetching request by number:', error)
      throw error
    }
  }

  // Get all requests (for admin)
  static async getAllRequests(): Promise<StationPartnershipRequest[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.STATION_PARTNERSHIP_REQUESTS)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching all requests:', error)
      throw error
    }
  }

  // Update request status
  static async updateRequestStatus(
    requestNumber: string, 
    status: 'pending' | 'approved' | 'rejected',
    rejectionReason?: string
  ) {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      }

      // Add rejection reason if status is rejected and reason is provided
      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }

      const { data, error } = await supabase
        .from(TABLES.STATION_PARTNERSHIP_REQUESTS)
        .update(updateData)
        .eq('request_number', requestNumber)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating request status:', error)
      throw error
    }
  }
}
