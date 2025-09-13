import { NextRequest, NextResponse } from 'next/server';

interface Station {
  id: string;
  name: string;
  nameAr?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  governorate: {
    name: string;
    nameAr?: string;
  };
  delegation: {
    name: string;
    nameAr?: string;
  };
  isActive: boolean;
  isOnline: boolean;
}

interface NearestStationRequest {
  latitude: number;
  longitude: number;
  limit?: number;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

export async function POST(request: NextRequest) {
  try {
    const body: NearestStationRequest = await request.json();
    const { latitude, longitude, limit = 5 } = body;

    // Validate coordinates
    if (!latitude || !longitude) {
      return NextResponse.json({
        success: false,
        message: 'Latitude and longitude are required',
        code: 'MISSING_COORDINATES'
      }, { status: 400 });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({
        success: false,
        message: 'Invalid coordinates provided',
        code: 'INVALID_COORDINATES'
      }, { status: 400 });
    }

    console.log(`🗺️ Finding nearest stations to coordinates: ${latitude}, ${longitude}`);

    // Call central server to get all active stations
    const centralServerResponse = await fetch('http://localhost:5000/api/v1/stations/public', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!centralServerResponse.ok) {
      console.error('❌ Failed to fetch stations from central server');
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch stations from server',
        code: 'SERVER_ERROR'
      }, { status: 500 });
    }

    const stationsResponse = await centralServerResponse.json();
    
    if (!stationsResponse.success) {
      return NextResponse.json({
        success: false,
        message: stationsResponse.message || 'Failed to fetch stations',
        code: 'STATIONS_FETCH_FAILED'
      }, { status: 500 });
    }

    const stations: Station[] = stationsResponse.data || [];

    // Filter stations that have coordinates and are active
    const stationsWithCoordinates = stations.filter(station => 
      station.latitude !== null && 
      station.longitude !== null && 
      station.isActive && 
      station.isOnline
    );

    if (stationsWithCoordinates.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active stations with coordinates found',
        code: 'NO_STATIONS_AVAILABLE'
      }, { status: 404 });
    }

    // Calculate distances and sort by nearest
    const stationsWithDistance = stationsWithCoordinates.map(station => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        station.latitude!, 
        station.longitude!
      );

      return {
        ...station,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        coordinates: [station.longitude, station.latitude] // For map display
      };
    });

    // Sort by distance and limit results
    const nearestStations = stationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    console.log(`✅ Found ${nearestStations.length} nearest stations. Closest: ${nearestStations[0]?.name} (${nearestStations[0]?.distance}km)`);

    return NextResponse.json({
      success: true,
      data: {
        userLocation: { latitude, longitude },
        stations: nearestStations,
        totalFound: nearestStations.length
      },
      message: `Found ${nearestStations.length} nearest stations`
    });

  } catch (error) {
    console.error('❌ Error finding nearest stations:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error while finding nearest stations',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// Optional: GET method for testing with query parameters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latitude = parseFloat(searchParams.get('lat') || '0');
  const longitude = parseFloat(searchParams.get('lng') || '0');
  const limit = parseInt(searchParams.get('limit') || '5');

  if (!latitude || !longitude) {
    return NextResponse.json({
      success: false,
      message: 'Please provide lat and lng query parameters',
      code: 'MISSING_PARAMETERS'
    }, { status: 400 });
  }

  // Reuse the POST logic
  const mockRequest = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, limit })
  });

  return POST(mockRequest as NextRequest);
} 