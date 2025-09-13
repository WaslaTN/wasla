'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { WaslaLogo } from '@/components/WaslaLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, LogOut, Users, BarChart3, Settings, MapPin, Activity, RefreshCw, Hexagon, Cpu, Terminal, Network } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FtZXIyNCIsImEiOiJjbThlMTN6Z2gybDhnMmxyN3FsbHFrbDl0In0.8d5HBrJTL7rb9PrL9krXVA'

interface Station {
  id: string
  name: string
  nameAr: string
  governorate: { name: string }
  delegation: { name: string }
  address: string
  latitude: number
  longitude: number
  isActive: boolean
  isOnline: boolean
  lastHeartbeat: string | null
  _count: {
    staff: number
    departureBookings: number
    destinationBookings: number
    queueEntries: number
  }
}

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  role: string
  station?: { name: string }
  isActive: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({})
  
  // Callback ref to track when container is ready
  const setMapContainerRef = (element: HTMLDivElement | null) => {
    if (element) {
      mapContainer.current = element
      console.log('Map container ref set, element:', element)
      setMapContainerReady(true)
    } else {
      mapContainer.current = null
      setMapContainerReady(false)
    }
  }
  
  const [userProfile, setUserProfile] = useState<any>(null)
  const [stations, setStations] = useState<Station[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapContainerReady, setMapContainerReady] = useState(false)

  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    const userProfileData = localStorage.getItem('userProfile')
    
    if (!authToken || !userProfileData) {
      router.push('/station-partnership/login')
      return
    }

    try {
      const profile = JSON.parse(userProfileData)
      if (profile.role !== 'ADMIN') {
        router.push('/station-partnership/login')
        return
      }
      setUserProfile(profile)
    } catch (error) {
      router.push('/station-partnership/login')
    }
  }, [router])

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)
      const authToken = localStorage.getItem('authToken')
      
      // Test connection to localhost:5000 first
      try {
        const connectionTest = await fetch('http://localhost:5000/api/v1/stations', { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        console.log('Connection test successful:', connectionTest.status)
      } catch (connectionError) {
        console.error('Connection test failed:', connectionError)
        setMapError('Cannot connect to server. Please ensure the local server is running on localhost:5000')
        setStations([])
        setStaff([])
        setLoading(false)
        return
      }
      
      // Fetch stations (public endpoint)
      console.log('Fetching stations from:', 'http://localhost:5000/api/v1/stations')
      const stationsResponse = await fetch('http://localhost:5000/api/v1/stations')
      console.log('Stations response status:', stationsResponse.status)
      
      if (!stationsResponse.ok) {
        console.error('Stations API error:', stationsResponse.status, stationsResponse.statusText)
        setStations([])
        return
      }
      
      const stationsData = await stationsResponse.json()
      console.log('Stations response data:', stationsData)
      
      if (stationsData.success) {
        console.log('Stations fetched successfully:', stationsData.data.stations.length, 'stations')
        setStations(stationsData.data.stations)
      } else {
        console.error('Failed to fetch stations:', stationsData.message)
        setStations([])
      }

      // Fetch staff (requires auth)
      if (authToken) {
        try {
          const staffResponse = await fetch('http://localhost:5000/api/v1/staff', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          })
          
          if (staffResponse.ok) {
            const staffData = await staffResponse.json()
            
            if (staffData.success) {
              setStaff(staffData.data.staff)
            } else {
              console.error('Failed to fetch staff:', staffData.message)
              setStaff([])
            }
          } else {
            console.error('Staff API error:', staffResponse.status, staffResponse.statusText)
            setStaff([])
          }
        } catch (staffError) {
          console.error('Error fetching staff:', staffError)
          setStaff([])
        }
      } else {
        console.log('No auth token, skipping staff fetch')
        setStaff([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setStations([])
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userProfile) {
      fetchData()
    }
  }, [userProfile])

  // Initialize Mapbox
  useEffect(() => {
    console.log('Map useEffect triggered:', {
      hasMapContainer: !!mapContainer.current,
      mapContainerReady,
      stationsLength: stations.length,
      mapError,
      containerElement: mapContainer.current
    })
    
    if (!mapContainer.current || !mapContainerReady || stations.length === 0) {
      console.log('Map initialization skipped:', {
        reason: !mapContainer.current ? 'No map container' : !mapContainerReady ? 'Container not ready' : 'No stations data',
        containerExists: !!mapContainer.current,
        containerReady: mapContainerReady,
        stationsCount: stations.length
      })
      return
    }

    console.log('✅ All conditions met, proceeding with map initialization')
    console.log('Container element:', mapContainer.current)
    console.log('Container dimensions:', mapContainer.current.offsetWidth, 'x', mapContainer.current.offsetHeight)
    
    // Ensure container has proper dimensions
    if (mapContainer.current.offsetWidth === 0 || mapContainer.current.offsetHeight === 0) {
      console.log('⚠️ Container has zero dimensions, waiting for proper sizing...')
      // Wait a bit for the container to be properly sized
      setTimeout(() => {
        if (mapContainer.current && mapContainer.current.offsetWidth > 0 && mapContainer.current.offsetHeight > 0) {
          console.log('✅ Container now has proper dimensions, retrying initialization')
          // Trigger the effect again
          setMapContainerReady(false)
          setTimeout(() => setMapContainerReady(true), 100)
        }
      }, 100)
      return
    }

    // Small delay to ensure DOM is fully rendered
    const initTimeout = setTimeout(() => {
      console.log('🚀 Initializing Mapbox map...')
      
      // Double-check that container is still valid
      if (!mapContainer.current) {
        console.error('❌ Container is no longer valid, aborting initialization')
        return
      }
      
              setMapError(null)
      console.log('Starting map initialization for', stations.length, 'stations')

      try {
        mapboxgl.accessToken = MAPBOX_TOKEN

        map.current = new mapboxgl.Map({
          container: mapContainer.current!, // We know it's not null here due to the check above
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [9.537499, 33.886917], // Tunisia center
          zoom: 6,
          minZoom: 5,
          maxZoom: 15
        })

        // Function to add markers to the map
        const addMarkersToMap = () => {
          if (!map.current) return
          
          console.log('Adding markers for', stations.length, 'stations')
          
          // Create bounds to fit all stations
          const bounds = new mapboxgl.LngLatBounds()
          
          // Add stations as markers
          stations.forEach((station, index) => {
            try {
              console.log(`Adding marker ${index + 1}/${stations.length}:`, station.name, 'at', [station.longitude, station.latitude])
              
              // Create marker with simple colored style like in requests page
              const marker = new mapboxgl.Marker({
                color: station.isOnline ? '#10b981' : '#ef4444',
                scale: 1.2
              })
                .setLngLat([station.longitude, station.latitude])
                .setPopup(new mapboxgl.Popup({
                  offset: 25,
                  className: 'custom-popup'
                }).setHTML(`
                  <div class="p-3 bg-gray-900 text-white rounded-lg border border-red-500/30">
                    <h3 class="font-semibold text-red-400 mb-2">${station.name}</h3>
                    <p class="text-sm text-gray-300 mb-1">${station.governorate.name}, ${station.delegation.name}</p>
                    <p class="text-sm text-gray-400 mb-2">${station.address || 'No address'}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xs">
                        Status: <span class="${station.isOnline ? 'text-green-400' : 'text-red-400'} font-medium">${station.isOnline ? 'Online' : 'Offline'}</span>
                      </span>
                      <span class="text-xs text-gray-300">
                        Staff: ${station._count?.staff || 0}
                      </span>
                    </div>
                  </div>
                `))
                .addTo(map.current!)

              // Add coordinates to bounds
              bounds.extend([station.longitude, station.latitude])

              markers.current[station.id] = marker
            } catch (markerError) {
              console.error('Error creating marker for station:', station.id, markerError)
            }
          })

          // Fit map to show all stations with padding
          if (bounds.isEmpty()) {
            console.log('No bounds to fit, using default Tunisia view')
          } else {
            console.log('Fitting map to bounds:', bounds.toArray())
            map.current.fitBounds(bounds, {
              padding: 50,
              maxZoom: 10
            })
          }
        }

        // Handle map load event
        map.current.on('load', () => {
          console.log('Map loaded successfully')
          addMarkersToMap()
        })

        // Handle map errors
        map.current.on('error', (error) => {
          console.error('Mapbox error:', error)
          setMapError('Failed to load map. Please check your internet connection.')
        })

        // Add a fallback timeout in case the load event doesn't fire
        const fallbackTimeout = setTimeout(() => {
          if (map.current && map.current.isStyleLoaded()) {
            console.log('Fallback: Map style loaded, proceeding with markers')
            addMarkersToMap()
          }
        }, 3000)

        // Return cleanup function
        return () => {
          clearTimeout(fallbackTimeout)
          clearTimeout(initTimeout) // Clear the new timeout
          if (map.current) {
            map.current.remove()
            map.current = null
          }
          // Clear markers reference
          markers.current = {}
        }

      } catch (mapError) {
        console.error('Error initializing Mapbox:', mapError)
        setMapError('Failed to initialize map. Please refresh the page.')
      }
    }, 100) // Small delay
  }, [stations, mapContainerReady]) // Only include proper dependencies

  // Handle table hover
  const handleStationHover = (stationId: string | null) => {
    setHoveredStationId(stationId)
    
    if (stationId && markers.current[stationId]) {
      // Highlight marker by changing color to gold
      Object.keys(markers.current).forEach(id => {
        const marker = markers.current[id]
        if (id === stationId) {
          // Remove the old marker and create a new gold one
          marker.remove()
          const station = stations.find(s => s.id === id)
          if (station && map.current) {
            const newMarker = new mapboxgl.Marker({
              color: '#fbbf24', // Gold color
              scale: 1.2
            })
              .setLngLat([station.longitude, station.latitude])
              .setPopup(new mapboxgl.Popup({
                offset: 25,
                className: 'custom-popup'
              }).setHTML(`
                <div class="p-3 bg-gray-900 text-white rounded-lg border border-red-500/30">
                  <h3 class="font-semibold text-red-400 mb-2">${station.name}</h3>
                  <p class="text-sm text-gray-300 mb-1">${station.governorate.name}, ${station.delegation.name}</p>
                  <p class="text-sm text-gray-400 mb-2">${station.address || 'No address'}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-xs">
                      Status: <span class="${station.isOnline ? 'text-green-400' : 'text-red-400'} font-medium">${station.isOnline ? 'Online' : 'Offline'}</span>
                    </span>
                    <span class="text-xs text-gray-300">
                      Staff: ${station._count?.staff || 0}
                    </span>
                  </div>
                </div>
              `))
              .addTo(map.current!)
            markers.current[id] = newMarker
          }
        } else {
          // Reset other markers to their original colors
          const station = stations.find(s => s.id === id)
          if (station) {
            marker.remove()
            const newMarker = new mapboxgl.Marker({
              color: station.isOnline ? '#10b981' : '#ef4444',
              scale: 1.2
            })
              .setLngLat([station.longitude, station.latitude])
              .setPopup(new mapboxgl.Popup({
                offset: 25,
                className: 'custom-popup'
              }).setHTML(`
                <div class="p-3 bg-gray-900 text-white rounded-lg border border-red-500/30">
                  <h3 class="font-semibold text-red-400 mb-2">${station.name}</h3>
                  <p class="text-sm text-gray-300 mb-1">${station.governorate.name}, ${station.delegation.name}</p>
                  <p class="text-sm text-gray-400 mb-2">${station.address || 'No address'}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-xs">
                      Status: <span class="${station.isOnline ? 'text-green-400' : 'text-red-400'} font-medium">${station.isOnline ? 'Online' : 'Offline'}</span>
                    </span>
                    <span class="text-xs text-gray-300">
                      Staff: ${station._count?.staff || 0}
                    </span>
                  </div>
                </div>
              `))
              .addTo(map.current!)
            markers.current[id] = newMarker
          }
        }
      })
    } else {
      // Reset all markers to their original colors
      Object.values(markers.current).forEach(marker => {
        const stationId = Object.keys(markers.current).find(id => markers.current[id] === marker)
        if (stationId) {
          const station = stations.find(s => s.id === stationId)
          if (station && map.current) {
            marker.remove()
            const newMarker = new mapboxgl.Marker({
              color: station.isOnline ? '#10b981' : '#ef4444',
              scale: 1.2
            })
              .setLngLat([station.longitude, station.latitude])
              .setPopup(new mapboxgl.Popup({
                offset: 25,
                className: 'custom-popup'
              }).setHTML(`
                <div class="p-3 bg-gray-900 text-white rounded-lg border border-red-500/30">
                  <h3 class="font-semibold text-red-400 mb-2">${station.name}</h3>
                  <p class="text-sm text-gray-300 mb-1">${station.governorate.name}, ${station.delegation.name}</p>
                  <p class="text-sm text-gray-400 mb-2">${station.address || 'No address'}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-xs">
                      Status: <span class="${station.isOnline ? 'text-green-400' : 'text-red-400'} font-medium">${station.isOnline ? 'Online' : 'Offline'}</span>
                    </span>
                    <span class="text-xs text-gray-300">
                      Staff: ${station._count?.staff || 0}
                    </span>
                  </div>
                </div>
              `))
              .addTo(map.current!)
            markers.current[stationId] = newMarker
          }
        }
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userProfile')
    router.push('/station-partnership/login')
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black/80 to-red-950/20" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-black/80 backdrop-blur-md border-b border-red-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <WaslaLogo size={32} variant="simple" />
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white font-mono">Wasla</h1>
                  <span className="text-xl font-bold text-orange-400 font-arabic">وصلة</span>
                  <span className="text-red-400 font-mono">ADMIN</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 font-mono">
                  {userProfile.firstName} {userProfile.lastName}
                </span>
                <Button
                  onClick={fetchData}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 font-mono"
                  disabled={loading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  REFRESH
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 font-mono"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  LOGOUT
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Quick Actions */}
            <div className="mb-6 flex flex-wrap gap-4">
              <Button
                onClick={() => router.push('/admin/requests')}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border border-red-500/30 shadow-2xl shadow-red-500/20"
              >
                <Terminal className="mr-2 h-4 w-4" />
                VIEW_PARTNERSHIP_REQUESTS
              </Button>
            </div>
            
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2 font-mono">SYSTEM_OVERVIEW</h2>
              <p className="text-gray-400 font-mono">REAL_TIME_STATION_MONITORING_AND_MANAGEMENT</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/30 hover:shadow-2xl hover:shadow-red-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                      <MapPin className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 font-mono">TOTAL_STATIONS</p>
                      <p className="text-2xl font-bold text-white">{stations.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/50 backdrop-blur-sm border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                      <Activity className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 font-mono">ONLINE_STATIONS</p>
                      <p className="text-2xl font-bold text-white">
                        {stations.filter(s => s.isOnline).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                      <Users className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 font-mono">TOTAL_STAFF</p>
                      <p className="text-2xl font-bold text-white">{staff?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                      <BarChart3 className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 font-mono">TOTAL_BOOKINGS</p>
                      <p className="text-2xl font-bold text-white">
                        {stations.reduce((total, station) => 
                          total + station._count.departureBookings + station._count.destinationBookings, 0
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Stations Map */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center font-mono">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center border border-orange-500/30 mr-2">
                      <MapPin className="h-5 w-5 text-orange-400" />
                    </div>
                    STATIONS_MAP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mapError ? (
                    <div className="h-96 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-400 font-medium mb-2">Map Loading Error</p>
                        <p className="text-red-300 text-sm mb-3">{mapError}</p>
                        <Button
                          onClick={() => {
                            setMapError(null)
                            fetchData()
                          }}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : stations.length === 0 ? (
                    <div className="h-96 rounded-lg border border-white/20 bg-black/20 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium mb-2">No Stations Available</p>
                        <p className="text-gray-500 text-sm mb-3">No station data was found or the server is not responding</p>
                        <Button
                          onClick={fetchData}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div 
                        ref={setMapContainerRef} 
                        className="h-96 rounded-lg border border-white/20 overflow-hidden relative"
                      />
                      <div className="mt-4 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <span className="text-gray-400">Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <span className="text-gray-400">Offline</span>
                        </div>
                      </div>
                      {stations.length > 0 && (
                        <div className="mt-4 p-3 bg-black/20 rounded-lg">
                          <p className="text-xs text-gray-400 text-center">
                            💡 <strong>Interactive Features:</strong> Hover over stations in the table to highlight them on the map, and click on map markers to see station details
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Stations Table */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center font-mono">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30 mr-2">
                      <BarChart3 className="h-5 w-5 text-purple-400" />
                    </div>
                    STATIONS_OVERVIEW
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stations.map((station) => (
                          <div
                            key={station.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                              hoveredStationId === station.id
                                ? 'bg-red-600/20 border-red-500/50'
                                : 'bg-black/20 border-white/10 hover:bg-white/5'
                            }`}
                            onMouseEnter={() => handleStationHover(station.id)}
                            onMouseLeave={() => handleStationHover(null)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-white font-medium text-sm">{station.name}</h4>
                                <p className="text-gray-400 text-xs">{station.governorate.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  station.isOnline ? 'bg-green-400' : 'bg-red-400'
                                }`}></div>
                                <span className={`text-xs ${
                                  station.isOnline ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {station.isOnline ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                              <span>Staff: {station._count.staff}</span>
                              <span>Bookings: {station._count.departureBookings + station._count.destinationBookings}</span>
                              <span>Queue: {station._count.queueEntries}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

                        {/* Staff Overview */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-cyan-500/30 mt-8 hover:shadow-2xl hover:shadow-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center font-mono">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30 mr-2">
                    <Users className="h-5 w-5 text-cyan-400" />
                  </div>
                  STAFF_OVERVIEW
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
                  </div>
                ) : staff && staff.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {staff.filter(s => s.role === 'SUPERVISOR').length}
                      </p>
                      <p className="text-sm text-gray-400">Supervisors</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">
                        {staff.filter(s => s.role === 'WORKER').length}
                      </p>
                      <p className="text-sm text-gray-400">Workers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">
                        {staff.filter(s => s.isActive).length}
                      </p>
                      <p className="text-sm text-gray-400">Active Staff</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">
                      {!staff ? 'Loading staff data...' : 'No staff data available'}
                    </p>
                    {!staff && (
                      <p className="text-sm text-gray-500 mt-2">
                        Make sure you're logged in with admin privileges
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Custom CSS for Mapbox popups */}
      <style jsx global>{`
        .custom-popup .mapboxgl-popup-content {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-popup .mapboxgl-popup-tip {
          border-top-color: rgba(239, 68, 68, 0.3) !important;
        }
      `}</style>
    </div>
  )
}