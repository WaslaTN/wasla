// Types for Tunisia municipalities API
export interface Delegation {
  Name: string
  NameAr: string
  Value: string
  PostalCode: string
  Latitude: number
  Longitude: number
}

export interface Governorate {
  Name: string
  NameAr: string
  Value: string
  Delegations: Delegation[]
}

const BASE_URL = '/api/municipalities'

export class TunisiaMunicipalityService {
  static async getAllMunicipalities(): Promise<Governorate[]> {
    try {
      const response = await fetch(BASE_URL)
      if (!response.ok) {
        throw new Error('Failed to fetch municipalities')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching municipalities:', error)
      throw error
    }
  }

  static async getMunicipalitiesByGovernorate(governorate: string): Promise<Governorate[]> {
    try {
      const response = await fetch(`${BASE_URL}?name=${encodeURIComponent(governorate)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch municipalities by governorate')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching municipalities by governorate:', error)
      throw error
    }
  }

  static async getMunicipalitiesByDelegation(delegation: string): Promise<Governorate[]> {
    try {
      const response = await fetch(`${BASE_URL}?delegation=${encodeURIComponent(delegation)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch municipalities by delegation')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching municipalities by delegation:', error)
      throw error
    }
  }

  static async getNearbyMunicipalities(lat: number, lng: number, radius: number = 5000): Promise<Governorate[]> {
    try {
      const response = await fetch(`${BASE_URL}/near?lat=${lat}&lng=${lng}&radius=${radius}`)
      if (!response.ok) {
        throw new Error('Failed to fetch nearby municipalities')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching nearby municipalities:', error)
      throw error
    }
  }

  static getDelegationCoordinates(governorates: Governorate[], governorateName: string, delegationName: string): { latitude: number; longitude: number } | null {
    const governorate = governorates.find(gov => 
      gov.Name.toLowerCase() === governorateName.toLowerCase() ||
      gov.Value.toLowerCase() === governorateName.toLowerCase()
    )
    
    if (!governorate) return null
    
    const delegation = governorate.Delegations.find(del => 
      del.Name.toLowerCase().includes(delegationName.toLowerCase()) ||
      del.Value.toLowerCase() === delegationName.toLowerCase()
    )
    
    if (!delegation) return null
    
    return {
      latitude: delegation.Latitude,
      longitude: delegation.Longitude
    }
  }
}
