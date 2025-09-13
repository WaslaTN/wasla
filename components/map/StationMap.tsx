"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Clock, Users, Navigation, Search, RotateCcw, Zap, Route, Crosshair, Loader, CheckCircle2, Timer, CreditCard, User } from "lucide-react";
import { Map, Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox tokens
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FtZXIyNCIsImEiOiJjbThlMTN6Z2gybDhnMmxyN3FsbHFrbDl0In0.8d5HBrJTL7rb9PrL9krXVA';
interface Station {
  id: string;
  stationId?: string;
  name: string;
  stationName?: string;
  nameAr?: string;
  stationNameAr?: string;
  governorate: string | {
    name: string;
    nameAr?: string;
  };
  governorateAr?: string;
  delegation: string | {
    name: string;
    nameAr?: string;
  };
  delegationAr?: string;
  address?: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
  isOnline: boolean;
  lastHeartbeat?: string | null;
  lastChecked?: string;
  destinationCount?: number;
  localServerIp?: string | null;
  supervisorId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  supervisor?: any;
  _count?: {
    staff: number;
    departureBookings: number;
    destinationBookings: number;
    queueEntries: number;
  };
  coordinates?: [number, number];
  city?: string;
  distance?: number;
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

interface StationMapProps {
  stations: Station[];
  destinations: RouteDestination[];
  selectedDeparture: Station | null;
  selectedDestination: RouteDestination | null;
  onStationSelect: (stationId: string) => void;
  onDestinationSelect: (destination: RouteDestination) => void;
  showRoute: boolean;
  mapboxAccessToken: string;
}

const StationMap: React.FC<StationMapProps> = ({
  stations,
  destinations,
  selectedDeparture,
  selectedDestination,
  onStationSelect,
  onDestinationSelect,
  showRoute,
  mapboxAccessToken
}) => {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: 10.1815, // Tunisia center
    latitude: 35.8245,
    zoom: 6.5
  });
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [animatingStation, setAnimatingStation] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Center map on Tunisia
  const tunisiaBounds = {
    north: 37.5,
    south: 30.0,
    east: 12.0,
    west: 7.0
  };

  // Fit map to show all stations
  useEffect(() => {
    if (stations.length > 0 && mapRef.current) {
      const bounds = stations.reduce(
        (acc, station) => ({
          north: Math.max(acc.north, station.latitude),
          south: Math.min(acc.south, station.latitude),
          east: Math.max(acc.east, station.longitude),
          west: Math.min(acc.west, station.longitude)
        }),
        { north: -90, south: 90, east: -180, west: 180 }
      );

      // Add padding
      const padding = 0.5;
      const fitBounds = {
        north: Math.min(bounds.north + padding, tunisiaBounds.north),
        south: Math.max(bounds.south - padding, tunisiaBounds.south),
        east: Math.min(bounds.east + padding, tunisiaBounds.east),
        west: Math.max(bounds.west - padding, tunisiaBounds.west)
      };

      if (mapRef.current?.getMap) {
        mapRef.current.getMap().fitBounds(
          [[fitBounds.west, fitBounds.south], [fitBounds.east, fitBounds.north]],
          { padding: 50, duration: 1000 }
        );
      }
    }
  }, [stations]);

  // Fetch route data when both departure and destination are selected
  useEffect(() => {
    if (selectedDeparture && selectedDestination && showRoute) {
      fetchRouteData();
    } else {
      setRouteGeometry(null);
    }
  }, [selectedDeparture, selectedDestination, showRoute]);

  const fetchRouteData = async () => {
    if (!selectedDeparture || !selectedDestination) return;

    const destCoords = getDestinationCoordinates(selectedDestination);
    setIsLoadingRoute(true);

    try {
      // Use Mapbox Directions API to get route
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${selectedDeparture.longitude},${selectedDeparture.latitude};${destCoords.longitude},${destCoords.latitude}?geometries=geojson&access_token=${mapboxAccessToken || MAPBOX_TOKEN}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const routeGeoJSON = {
            type: 'Feature',
            properties: {
              distance: data.routes[0].distance,
              duration: data.routes[0].duration
            },
            geometry: data.routes[0].geometry
          };
          setRouteGeometry(routeGeoJSON);

          // Fit the map to show the entire route
          if (mapRef.current?.getMap) {
            const map = mapRef.current.getMap();
            const coordinates = data.routes[0].geometry.coordinates;
            let minLng = coordinates[0][0], maxLng = coordinates[0][0];
            let minLat = coordinates[0][1], maxLat = coordinates[0][1];

            coordinates.forEach((coord: [number, number]) => {
              minLng = Math.min(minLng, coord[0]);
              maxLng = Math.max(maxLng, coord[0]);
              minLat = Math.min(minLat, coord[1]);
              maxLat = Math.max(maxLat, coord[1]);
            });

            const bounds = [[minLng, minLat], [maxLng, maxLat]];
            map.fitBounds(bounds, { padding: 80, duration: 1500 });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      // Fallback to straight line
      const fallbackRouteGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [selectedDeparture.longitude, selectedDeparture.latitude],
            [destCoords.longitude, destCoords.latitude]
          ]
        }
      };
      setRouteGeometry(fallbackRouteGeoJSON);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Helper function to get destination coordinates (fallback to station coordinates if not provided)
  const getDestinationCoordinates = (destination: RouteDestination) => {
    if (destination.latitude && destination.longitude) {
      return { latitude: destination.latitude, longitude: destination.longitude };
    }
    
    // Fallback: try to find the destination in the stations list
    const destStation = stations.find(s => 
      s.id === destination.destinationId || 
      s.name === destination.destinationName
    );
    if (destStation) {
      return { latitude: destStation.latitude, longitude: destStation.longitude };
    }
    
    // Fallback coordinates for common Tunisian cities (approximate)
    const cityCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
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
    const cityName = destination.destinationName.toLowerCase();
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (cityName.includes(city)) {
        return coords;
      }
    }
    
    // Default fallback (center of Tunisia)
    return { latitude: 35.8245, longitude: 10.1815 };
  };

  const handleMapClick = (event: any) => {
    // Handle map clicks if needed
  };

  const handleMapLoad = () => {
    setIsMapLoaded(true);

    if (mapRef.current) {
      const map = mapRef.current.getMap();

      // Add 3D buildings layer
      map.on('style.load', () => {
        // Check if the layer already exists
        if (!map.getLayer('add-3d-buildings')) {
          map.addLayer({
            id: 'add-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': '#1f2937',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.8
            }
          });
        }
      });
    }
  };

  const getGovernorate = (station: Station) => {
    return typeof station.governorate === 'string' 
      ? station.governorate 
      : station.governorate?.name || 'Unknown';
  };

  const getDelegation = (station: Station) => {
    return typeof station.delegation === 'string' 
      ? station.delegation 
      : station.delegation?.name || 'Unknown';
  };

  return (
    <div className="relative h-96 w-full rounded-lg overflow-hidden border border-slate-600">
      {!mapboxAccessToken && !MAPBOX_TOKEN ? (
        <div className="flex items-center justify-center h-full bg-slate-800/50">
          <div className="text-center p-6">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Mapbox Token Required</h3>
            <p className="text-gray-400 text-sm">
              Please add your Mapbox access token to display the interactive map.
            </p>
          </div>
        </div>
      ) : (
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxAccessToken || MAPBOX_TOKEN}
          {...viewState}
          onMove={(evt: any) => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          onClick={handleMapClick}
          onLoad={handleMapLoad}
        >
          {/* Loading overlay while map initializes */}
          {!isMapLoaded && (
            <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                <p className="text-white text-sm">Loading map...</p>
              </div>
            </div>
          )}
          {/* Navigation Controls */}
          <NavigationControl position="top-right" />
          <GeolocateControl position="top-right" />

          {/* Route line */}
          {routeGeometry && (
            <Source
              id="route"
              type="geojson"
              data={routeGeometry}
            >
              {/* Outer glow for visibility */}
              <Layer
                id="route-line-outer-glow"
                type="line"
                paint={{
                  'line-color': '#1e40af',
                  'line-width': 12,
                  'line-opacity': 0.2,
                  'line-blur': 4,
                }}
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
              />
              {/* Main route line */}
              <Layer
                id="route-line"
                type="line"
                paint={{
                  'line-color': isLoadingRoute ? '#6b7280' : '#3b82f6',
                  'line-width': 5,
                  'line-opacity': isLoadingRoute ? 0.5 : 0.9,
                }}
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
              />
              {/* Inner glow */}
              <Layer
                id="route-line-glow"
                type="line"
                paint={{
                  'line-color': isLoadingRoute ? '#9ca3af' : '#60a5fa',
                  'line-width': 8,
                  'line-opacity': isLoadingRoute ? 0.2 : 0.4,
                  'line-blur': 2,
                }}
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
              />
            </Source>
          )}

          {/* Station markers (online stations) - Only render when map is loaded */}
          {isMapLoaded && stations.filter(station => station.isOnline).map((station) => {
            const isSelected = selectedDeparture?.id === station.id;

            return (
              <Marker
                key={`station-${station.id}`}
                longitude={station.longitude}
                latitude={station.latitude}
                onClick={(e: any) => {
                  e.originalEvent.stopPropagation();
                  onStationSelect(station.id);
                  setAnimatingStation(station.id);
                  setTimeout(() => setAnimatingStation(null), 2000);
                }}
              >
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                      animatingStation === station.id
                        ? 'animate-ping bg-green-500 border-green-400 scale-150'
                        : isSelected
                        ? 'bg-blue-500 border-blue-400 scale-125 shadow-lg shadow-blue-500/50'
                        : 'bg-green-500 border-green-400 hover:bg-green-600 hover:scale-110 shadow-lg shadow-green-500/30'
                    }`}
                    title={`${station.name} - Online`}
                  >
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white flex items-center justify-center">
                    <Zap className="w-2 h-2 text-white" />
                  </div>
                </div>
              </Marker>
            );
          })}

          {/* Destination markers (when departure is selected) - Only render when map is loaded */}
          {isMapLoaded && selectedDeparture && destinations.length > 0 && destinations.map((destination) => {
            const coords = getDestinationCoordinates(destination);
            const isSelected = selectedDestination?.destinationId === destination.destinationId;

            return (
              <Marker
                key={`destination-${destination.destinationId}`}
                longitude={coords.longitude}
                latitude={coords.latitude}
                onClick={(e: any) => {
                  e.originalEvent.stopPropagation();
                  onDestinationSelect(destination);
                }}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'bg-purple-500 border-purple-400 scale-125 shadow-lg shadow-purple-500/50'
                      : 'bg-orange-500 border-orange-400 hover:bg-orange-600 hover:scale-110 shadow-lg shadow-orange-500/30'
                  }`}
                  title={destination.destinationName}
                >
                  <Navigation className="w-4 h-4 text-white" />
                </div>
              </Marker>
            );
          })}
        </Map>
      )}

      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-white">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <MapPin className="w-2 h-2 text-white" />
          </div>
          <span>Online Stations</span>
        </div>
        {selectedDeparture && (
          <div className="flex items-center gap-2 text-sm text-white">
            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <Navigation className="w-2 h-2 text-white" />
            </div>
            <span>Available Destinations</span>
          </div>
        )}
        {selectedDeparture && selectedDestination && (
          <div className="flex items-center gap-2 text-sm text-white">
            <div className="w-4 h-1 bg-blue-500 rounded"></div>
            <span>Route</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationMap;
