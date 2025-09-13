// Station data matching central-server/prisma/seed.ts
export interface Station {
  id: string;
  name: string;
  nameAr: string;
  city?: string;
  latitude: number;
  longitude: number;
  coordinates: [number, number]; // [longitude, latitude] for Mapbox
  distance?: number;
  governorate: {
    name: string;
    nameAr: string;
  };
  delegation: {
    name: string;
    nameAr: string;
  };
  address: string;
  isActive: boolean;
  isOnline: boolean;
}

// Stations data from central-server seed file
export const TUNISIA_STATIONS: Station[] = [
  {
    id: 'tunis-main-station',
    name: 'Tunis Main Station',
    nameAr: 'محطة تونس الرئيسية',
    city: 'Tunis',
    latitude: 36.8065,
    longitude: 10.1815,
    coordinates: [10.1815, 36.8065],
    address: 'Avenue Habib Bourguiba, Tunis',
    isActive: true,
    isOnline: false,
    governorate: { name: 'Tunis', nameAr: 'تونس' },
    delegation: { name: 'Tunis Center', nameAr: 'تونس المركز' }
  },
  {
    id: 'monastir-main-station',
    name: 'Monastir Main Station',
    nameAr: 'محطة المنستير الرئيسية',
    city: 'Monastir',
    latitude: 35.7617,
    longitude: 10.8276,
    coordinates: [10.8276, 35.7617],
    address: 'Avenue de l\'Indépendance, Monastir',
    isActive: true,
    isOnline: true, // Online for demo
    governorate: { name: 'Monastir', nameAr: 'المنستير' },
    delegation: { name: 'Monastir Center', nameAr: 'المنستير المركز' }
  },
  {
    id: 'sfax-main-station',
    name: 'Sfax Main Station',
    nameAr: 'محطة صفاقس الرئيسية',
    city: 'Sfax',
    latitude: 34.7406,
    longitude: 10.7603,
    coordinates: [10.7603, 34.7406],
    address: 'Avenue Hedi Chaker, Sfax',
    isActive: true,
    isOnline: true, // Online for demo
    governorate: { name: 'Sfax', nameAr: 'صفاقس' },
    delegation: { name: 'Sfax Center', nameAr: 'صفاقس المركز' }
  },
  {
    id: 'gafsa-main-station',
    name: 'Gafsa Main Station',
    nameAr: 'محطة قفصة الرئيسية',
    city: 'Gafsa',
    latitude: 34.4217,
    longitude: 8.7842,
    coordinates: [8.7842, 34.4217],
    address: 'Avenue Ali Belhaouane, Gafsa',
    isActive: true,
    isOnline: false,
    governorate: { name: 'Gafsa', nameAr: 'قفصة' },
    delegation: { name: 'Gafsa Center', nameAr: 'قفصة المركز' }
  }
];

// Route data from central server
export interface RouteInfo {
  id: string;
  fromStationId: string;
  toStationId: string;
  price: number;
  distance?: number;
  duration?: string;
}

export const TUNISIA_ROUTES: RouteInfo[] = [
  // Tunis routes
  { id: 'tunis-monastir-route', fromStationId: 'tunis-main-station', toStationId: 'monastir-main-station', price: 25.00, distance: 161, duration: '2h 30m' },
  { id: 'tunis-sfax-route', fromStationId: 'tunis-main-station', toStationId: 'sfax-main-station', price: 35.00, distance: 270, duration: '4h 15m' },
  { id: 'tunis-gafsa-route', fromStationId: 'tunis-main-station', toStationId: 'gafsa-main-station', price: 45.00, distance: 370, duration: '5h 30m' },
  
  // Monastir routes
  { id: 'monastir-tunis-route', fromStationId: 'monastir-main-station', toStationId: 'tunis-main-station', price: 25.00, distance: 161, duration: '2h 30m' },
  { id: 'monastir-sfax-route', fromStationId: 'monastir-main-station', toStationId: 'sfax-main-station', price: 20.00, distance: 140, duration: '2h 15m' },
  { id: 'monastir-gafsa-route', fromStationId: 'monastir-main-station', toStationId: 'gafsa-main-station', price: 40.00, distance: 280, duration: '4h 45m' },
  
  // Sfax routes
  { id: 'sfax-tunis-route', fromStationId: 'sfax-main-station', toStationId: 'tunis-main-station', price: 35.00, distance: 270, duration: '4h 15m' },
  { id: 'sfax-monastir-route', fromStationId: 'sfax-main-station', toStationId: 'monastir-main-station', price: 20.00, distance: 140, duration: '2h 15m' },
  { id: 'sfax-gafsa-route', fromStationId: 'sfax-main-station', toStationId: 'gafsa-main-station', price: 30.00, distance: 180, duration: '3h 00m' },
  
  // Gafsa routes
  { id: 'gafsa-tunis-route', fromStationId: 'gafsa-main-station', toStationId: 'tunis-main-station', price: 45.00, distance: 370, duration: '5h 30m' },
  { id: 'gafsa-monastir-route', fromStationId: 'gafsa-main-station', toStationId: 'monastir-main-station', price: 40.00, distance: 280, duration: '4h 45m' },
  { id: 'gafsa-sfax-route', fromStationId: 'gafsa-main-station', toStationId: 'sfax-main-station', price: 30.00, distance: 180, duration: '3h 00m' }
];

// Helper functions
export const getStationById = (id: string): Station | undefined => {
  return TUNISIA_STATIONS.find(station => station.id === id);
};

export const getRouteInfo = (fromId: string, toId: string): RouteInfo | undefined => {
  return TUNISIA_ROUTES.find(route => route.fromStationId === fromId && route.toStationId === toId);
};

export const getOnlineStations = (): Station[] => {
  return TUNISIA_STATIONS.filter(station => station.isOnline);
};

export const getActiveStations = (): Station[] => {
  return TUNISIA_STATIONS.filter(station => station.isActive);
}; 