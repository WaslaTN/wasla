import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for station partnership request
export interface StationPartnershipRequest {
  id?: string
  request_number: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  cin: string
  governorate: string
  delegation: string
  latitude?: number
  longitude?: number
  cin_front_url?: string
  cin_back_url?: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  created_at?: string
  updated_at?: string
}

// Database tables
export const TABLES = {
  STATION_PARTNERSHIP_REQUESTS: 'station_partnership_requests'
} as const

// Storage buckets
export const BUCKETS = {
  STATION_DOCUMENTS: 'station-documents'
} as const
