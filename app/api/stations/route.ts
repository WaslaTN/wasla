export async function GET() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/stations/public');
    
    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching stations from backend:', error);
    
    // Return fallback mock data if backend is unavailable
    const fallbackData = {
      success: true,
      data: [
        {
          id: 'tunis-central',
          name: 'Tunis Central Station',
          nameAr: 'محطة تونس المركزية',
          latitude: 36.8065,
          longitude: 10.1815,
          address: 'Avenue Habib Bourguiba, Tunis',
          isActive: true,
          isOnline: false,
          governorate: { name: 'Tunis', nameAr: 'تونس' },
          delegation: { name: 'Tunis Center', nameAr: 'تونس المركز' }
        },
        {
          id: 'sfax-main',
          name: 'Sfax Main Station',
          nameAr: 'محطة صفاقس الرئيسية',
          latitude: 34.7406,
          longitude: 10.7603,
          address: 'Avenue Hedi Chaker, Sfax',
          isActive: true,
          isOnline: true,
          governorate: { name: 'Sfax', nameAr: 'صفاقس' },
          delegation: { name: 'Sfax Center', nameAr: 'صفاقس المركز' }
        }
      ],
      message: 'Fallback station data (backend unavailable)',
      meta: { total: 2, hasCoordinates: 2 }
    };
    
    return Response.json(fallbackData);
  }
} 