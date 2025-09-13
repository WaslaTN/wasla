'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { Loader2, AlertCircle } from 'lucide-react';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface Station {
  id: string;
  name: string;
  nameAr: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  governorate: {
    name: string;
    nameAr: string;
  };
}

interface Route {
  id: string;
  basePrice: string;
  isActive: boolean;
  departureStation: Station;
  destinationStation: Station;
}

interface RoutesResponse {
  success: boolean;
  data: {
    routes: Route[];
  };
}

export function InteractiveMap() {
  const { t, language } = useLanguage();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Filter unique routes to avoid duplicates
  const filterUniqueRoutes = (routes: Route[]) => {
    const routeMap = new Map<string, Route>();
    
    routes.forEach(route => {
      const stations = [route.departureStation.id, route.destinationStation.id].sort();
      const key = `${stations[0]}-${stations[1]}`;
      
      if (!routeMap.has(key)) {
        routeMap.set(key, route);
      }
    });
    
    return Array.from(routeMap.values());
  };

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:5000/api/v1/routes');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: RoutesResponse = await response.json();
        
        if (data.success && data.data?.routes) {
          const uniqueRoutes = filterUniqueRoutes(data.data.routes);
          setRoutes(uniqueRoutes);
          
          // Extract unique stations
          const stationMap = new Map<string, Station>();
          data.data.routes.forEach(route => {
            stationMap.set(route.departureStation.id, route.departureStation);
            stationMap.set(route.destinationStation.id, route.destinationStation);
          });
          setStations(Array.from(stationMap.values()));
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching routes:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setRoutes([]);
        setStations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || loading || error || stations.length === 0) return;

    // Initialize map
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [9.5375, 33.8869], // Center of Tunisia
        zoom: 6,
        projection: { name: 'mercator' }
      });

      map.current.on('load', () => {
        if (!map.current) return;

        // Add route lines
        const routeLineString = {
          type: 'FeatureCollection' as const,
          features: routes.map(route => ({
            type: 'Feature' as const,
            properties: {
              price: route.basePrice,
              routeId: route.id
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [route.departureStation.longitude, route.departureStation.latitude],
                [route.destinationStation.longitude, route.destinationStation.latitude]
              ]
            }
          }))
        };

        // Add route source and layer
        map.current.addSource('routes', {
          type: 'geojson',
          data: routeLineString
        });

        map.current.addLayer({
          id: 'routes',
          type: 'line',
          source: 'routes',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#ef4444',
            'line-width': 3,
            'line-blur': 1
          }
        });

        // Add stations
        const stationPoints = {
          type: 'FeatureCollection' as const,
          features: stations.map(station => ({
            type: 'Feature' as const,
            properties: {
              name: language.code === 'fr' ? station.nameAr || station.name : station.name,
              governorate: language.code === 'fr' ? station.governorate.nameAr || station.governorate.name : station.governorate.name,
              isOnline: station.isOnline,
              stationId: station.id
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [station.longitude, station.latitude]
            }
          }))
        };

        // Add station source and layers
        map.current.addSource('stations', {
          type: 'geojson',
          data: stationPoints
        });

        // Add glow effect for stations
        map.current.addLayer({
          id: 'stations-glow',
          type: 'circle',
          source: 'stations',
          paint: {
            'circle-radius': 15,
            'circle-color': [
              'case',
              ['get', 'isOnline'],
              '#10b981',
              '#6b7280'
            ],
            'circle-opacity': 0.3,
            'circle-blur': 1
          }
        });

        // Add main station points
        map.current.addLayer({
          id: 'stations',
          type: 'circle',
          source: 'stations',
          paint: {
            'circle-radius': 8,
            'circle-color': [
              'case',
              ['get', 'isOnline'],
              '#10b981',
              '#6b7280'
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });

        // Add popups on station click
        map.current.on('click', 'stations', (e) => {
          if (!e.features?.[0]) return;
          
          const feature = e.features[0];
          const coordinates = (feature.geometry as any).coordinates.slice();
          const { name, governorate, isOnline } = feature.properties as any;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <div class="bg-black/90 text-white p-3 rounded-lg border border-red-500/30">
                <h3 class="font-bold text-red-400">${name}</h3>
                <p class="text-gray-300 text-sm">${governorate}</p>
                <div class="flex items-center mt-2">
                  <div class="w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}"></div>
                  <span class="text-xs ${isOnline ? 'text-green-400' : 'text-gray-400'}">${isOnline ? t('stationOnline') : t('stationOffline')}</span>
                </div>
              </div>
            `)
            .addTo(map.current!);
        });

        // Change cursor on hover
        map.current.on('mouseenter', 'stations', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'stations', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [stations, routes, loading, error, language.code, t]);

  const getStationName = (station: Station) => {
    return language.code === 'fr' ? station.nameAr || station.name : station.name;
  };

  if (loading) {
    return (
      <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
        <CardContent className="flex items-center justify-center p-8 h-96">
          <Loader2 className="h-8 w-8 animate-spin text-red-400 mr-3" />
          <span className="text-white">Loading interactive map...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center p-8 h-96">
          <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
          <span className="text-white text-center mb-4">Unable to load the interactive map right now.</span>
          <p className="text-gray-400 text-sm text-center max-w-md">
            Don't worry! You can still use our route table to find your destination and book your trip.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
      <CardContent className="p-0">
        <div className="relative">
          <div
            ref={mapContainer}
            className="w-full h-96 rounded-lg"
            style={{ minHeight: '400px' }}
          />
          
          {/* Legend */}
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-red-500/30">
            <div className="text-white text-sm font-semibold mb-2">Legend</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-green-400">{t('stationOnline')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                <span className="text-gray-400">{t('stationOffline')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-red-500 mr-2"></div>
                <span className="text-red-400">Routes</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}