interface StationApiResponse {
  success: boolean;
  message: string;
  data: {
    stations: Array<{
      id: string;
      name: string;
      nameAr: string;
      governorateId: string;
      delegationId: string;
      address: string;
      latitude: number;
      longitude: number;
      localServerIp: string | null;
      supervisorId: string | null;
      isActive: boolean;
      isOnline: boolean;
      lastHeartbeat: string | null;
      createdAt: string;
      updatedAt: string;
      governorate: {
        id: string;
        name: string;
      };
      delegation: {
        id: string;
        name: string;
      };
      supervisor: any;
      _count: {
        staff: number;
        departureBookings: number;
        destinationBookings: number;
        queueEntries: number;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface RouteDestination {
  destinationId: string;
  destinationName: string;
  destinationNameAr?: string;
  governorate: string;
  delegation: string;
  totalVehicles: number;
  availableSeats: number;
  estimatedDeparture: string;
  basePrice: number;
  vehicles: any[];
  latitude?: number;
  longitude?: number;
}

const BASE_URL = 'http://localhost:5000/api/v1';

export const stationService = {
  async getAllStations(): Promise<StationApiResponse> {
    const response = await fetch(`${BASE_URL}/stations`);
    if (!response.ok) {
      throw new Error('Failed to fetch stations');
    }
    return response.json();
  },

  async getStationDestinations(stationId: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/stations/${stationId}/destinations`);
    if (!response.ok) {
      throw new Error('Failed to fetch destinations');
    }
    return response.json();
  },

  async getRouteDetails(departureStationId: string, destinationStationId: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/routes/${departureStationId}/${destinationStationId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch route details');
    }
    return response.json();
  },

  // Transform API response to match our component interfaces
  transformStationData(apiResponse: StationApiResponse) {
    if (!apiResponse.success || !apiResponse.data.stations) {
      return [];
    }

    return apiResponse.data.stations.map(station => ({
      id: station.id,
      name: station.name,
      nameAr: station.nameAr,
      governorate: station.governorate,
      delegation: station.delegation,
      address: station.address,
      latitude: station.latitude,
      longitude: station.longitude,
      localServerIp: station.localServerIp,
      supervisorId: station.supervisorId,
      isActive: station.isActive,
      isOnline: station.isOnline,
      lastHeartbeat: station.lastHeartbeat || undefined,
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
      supervisor: station.supervisor,
      _count: station._count
    }));
  },

  // Add destination coordinates based on station data
  enrichDestinationsWithCoordinates(destinations: RouteDestination[], stations: any[]) {
    return destinations.map(dest => {
      // First try to find the destination station in the stations array
      const station = stations.find(s => 
        s.id === dest.destinationId || 
        s.stationId === dest.destinationId ||
        s.name === dest.destinationName
      );
      
      if (station && station.latitude && station.longitude) {
        return {
          ...dest,
          latitude: station.latitude,
          longitude: station.longitude
        };
      }
      
      // If not found in stations, try to use any existing coordinates in the destination
      if (dest.latitude && dest.longitude) {
        return dest;
      }
      
      // Fallback coordinates for common Tunisian cities (approximate)
      const cityCoordinates = {
        'tunis': { latitude: 36.8065, longitude: 10.1815 },
        'sfax': { latitude: 34.7406, longitude: 10.7603 },
        'monastir': { latitude: 35.7617, longitude: 10.8276 },
        'gafsa': { latitude: 34.4217, longitude: 8.7842 },
        'kairouan': { latitude: 35.6781, longitude: 10.0963 },
        'sousse': { latitude: 35.8256, longitude: 10.6369 },
        'gabès': { latitude: 33.8815, longitude: 10.0982 },
        'bizerte': { latitude: 37.2744, longitude: 9.8739 },
        'ariana': { latitude: 36.8622, longitude: 10.1647 },
        'nabeul': { latitude: 36.4561, longitude: 10.7376 }
      };
      
      // Try to match city name (case insensitive)
      const cityName = dest.destinationName.toLowerCase();
      for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (cityName.includes(city)) {
          return {
            ...dest,
            latitude: coords.latitude,
            longitude: coords.longitude
          };
        }
      }
      
      // Default fallback to center of Tunisia
      return {
        ...dest,
        latitude: 35.8245,
        longitude: 10.1815
      };
    });
  }
};

export default stationService;
