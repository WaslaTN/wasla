'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Shield, LogOut, MapPin, Eye, CheckCircle, XCircle, RefreshCw, ArrowLeft, X, ZoomIn, Hexagon, Cpu, Terminal, Network } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Location Map Component for individual request locations
function LocationMap({ latitude, longitude, requestName }: { latitude: number; longitude: number; requestName: string }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const locationMap = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    locationMap.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [longitude, latitude],
      zoom: 14
    })

    // Add navigation controls
    locationMap.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add a marker for the request location
    new mapboxgl.Marker({
      color: '#ef4444',
      scale: 1.2
    })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-3 bg-gray-900 text-white rounded-lg border border-red-500/30">
              <h3 class="font-semibold text-red-400 mb-2">${requestName}</h3>
              <p class="text-sm text-gray-300">Request Location</p>
            </div>
          `)
      )
      .addTo(locationMap.current)

    return () => {
      if (locationMap.current) {
        locationMap.current.remove()
      }
    }
  }, [latitude, longitude, requestName])

  return <div ref={mapContainer} className="w-full h-full" />
}

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FtZXIyNCIsImEiOiJjbThlMTN6Z2gybDhnMmxyN3FsbHFrbDl0In0.8d5HBrJTL7rb9PrL9krXVA'

interface StationPartnershipRequest {
  id: string
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
  created_at: string
  updated_at: string
}

export default function AdminRequests() {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({})
  
  const [userProfile, setUserProfile] = useState<any>(null)
  const [requests, setRequests] = useState<StationPartnershipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<StationPartnershipRequest | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; alt: string } | null>(null)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [requestToReject, setRequestToReject] = useState<string | null>(null)

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

  // Initialize map only when we have requests with coordinates
  useEffect(() => {
    if (!mapContainer.current || requests.length === 0) return

    // Only initialize if we have requests with coordinates
    const requestsWithCoords = requests.filter(req => req.latitude && req.longitude)
    if (requestsWithCoords.length === 0) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [10.1815, 36.8065], // Tunisia center
      zoom: 6
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.current.on('error', (e) => {
      console.error('Mapbox error:', e)
      setMapError('Failed to load map')
    })

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [requests])

  // Fetch requests
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/station-partnership/admin')
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }
      
      const result = await response.json()
      setRequests(result.data)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Update map markers when requests change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove())
    markers.current = {}

    // Add markers for requests with coordinates
    requests.forEach(request => {
      if (request.latitude && request.longitude) {
        const marker = new mapboxgl.Marker({
          color: getStatusColor(request.status),
          scale: 1.2
        })
          .setLngLat([request.longitude, request.latitude])
          .setPopup(
            new mapboxgl.Popup({ 
              offset: 25,
              className: 'custom-popup'
            })
              .setHTML(`
                <div class="p-3 bg-gray-900 text-white rounded-lg border border-red-500/30">
                  <h3 class="font-semibold text-red-400 mb-2">${request.first_name} ${request.last_name}</h3>
                  <p class="text-sm text-gray-300 mb-1">${request.governorate}, ${request.delegation}</p>
                  <p class="text-sm text-gray-400 mb-2">${request.request_number}</p>
                  <span class="inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(request.status)}">
                    ${request.status}
                  </span>
                </div>
              `)
          )
          .addTo(map.current!)

        markers.current[request.id] = marker
      }
    })
  }, [requests, map.current])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'approved': return '#10b981'
      case 'rejected': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    }
  }

  const updateRequestStatus = async (requestNumber: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      setUpdatingStatus(requestNumber)
      
      const response = await fetch('/api/station-partnership/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestNumber, status, rejectionReason })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update request status')
      }

      // Refresh the requests list
      await fetchRequests()
      
      // Close the modal if it's open
      if (selectedRequest?.request_number === requestNumber) {
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Error updating request status:', error)
      alert(error instanceof Error ? error.message : 'Failed to update request status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleRejectClick = (requestNumber: string) => {
    setRequestToReject(requestNumber)
    setRejectionReason('')
    setShowRejectionModal(true)
  }

  const handleRejectSubmit = async () => {
    if (!requestToReject || !rejectionReason.trim()) {
      alert('Please enter a rejection reason')
      return
    }

    await updateRequestStatus(requestToReject, 'rejected', rejectionReason)
    setShowRejectionModal(false)
    setRequestToReject(null)
    setRejectionReason('')
  }

  const handleApprove = async (requestNumber: string) => {
    try {
      // First update the local status
      await updateRequestStatus(requestNumber, 'approved')
      
      // Then send the approved request data to the central server
      const request = requests.find(r => r.request_number === requestNumber)
      if (request) {
        const centralServerResponse = await fetch(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || 'http://localhost:5000'}/api/v1/stations/partnership-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            requestNumber: request.request_number,
            firstName: request.first_name,
            lastName: request.last_name,
            email: request.email,
            phoneNumber: request.phone_number,
            cin: request.cin,
            governorate: request.governorate,
            delegation: request.delegation,
            latitude: request.latitude,
            longitude: request.longitude,
            cinFrontUrl: request.cin_front_url,
            cinBackUrl: request.cin_back_url
          })
        })

        if (centralServerResponse.ok) {
          const result = await centralServerResponse.json()
          console.log('✅ Successfully created station and supervisor in central server:', result)
          
          // Show success message
          alert(`Request approved! Station and supervisor created successfully.\n\nStation: ${result.data.station.name}\nSupervisor: ${result.data.supervisor.firstName} ${result.data.supervisor.lastName}`)
        } else {
          const errorData = await centralServerResponse.json()
          console.error('❌ Failed to create station in central server:', errorData)
          alert(`Request approved locally, but failed to create station in central server: ${errorData.message}`)
        }
      }
    } catch (error) {
      console.error('❌ Error in approval process:', error)
      alert('Request approved locally, but there was an error creating the station in the central server.')
    }
  }

  // Group requests by status
  const groupedRequests = requests.reduce((acc, request) => {
    if (!acc[request.status]) {
      acc[request.status] = []
    }
    acc[request.status].push(request)
    return acc
  }, {} as Record<string, StationPartnershipRequest[]>)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userProfile')
    router.push('/station-partnership/login')
  }

  const handleImageClick = (url: string, alt: string) => {
    setEnlargedImage({ url, alt })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-red-400" />
          <p className="text-gray-400">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Gradient Overlay with Red Accents */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-red-900/20 via-black/80 to-red-950/20" />

      {/* Neon Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-black/80 backdrop-blur-md border-b border-red-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin/dashboard')}
                  className="flex items-center space-x-2 text-white hover:text-red-400 hover:bg-red-500/10 font-mono"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>BACK_TO_DASHBOARD</span>
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                    <Hexagon className="h-4 w-4 text-red-400" />
                  </div>
                  <h1 className="text-xl font-semibold text-white font-mono">STATION_PARTNERSHIP_REQUESTS</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400 font-mono">
                  Welcome, {userProfile?.firstName} {userProfile?.lastName}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 font-mono"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  LOGOUT
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Requests List */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/30 hover:shadow-2xl hover:shadow-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white font-mono">
                    <span>PARTNERSHIP_REQUESTS ({requests.length})</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchRequests}
                      className="flex items-center space-x-2 border-red-500/50 text-red-400 hover:bg-red-500/10 font-mono"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>REFRESH</span>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {requests.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No partnership requests found
                      </div>
                    ) : (
                      Object.entries(groupedRequests).map(([status, statusRequests]) => (
                        <div key={status} className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-white capitalize">
                              {status} Requests
                            </h3>
                            <Badge className={getStatusBadgeClass(status as any)}>
                              {statusRequests.length}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            {statusRequests.map((request) => (
                              <div
                                key={request.id}
                                className="border border-white/10 rounded-lg p-4 hover:bg-white/5 cursor-pointer transition-all duration-200 hover:border-red-500/30"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <h4 className="font-medium text-white">
                                        {request.first_name} {request.last_name}
                                      </h4>
                                      <Badge className={getStatusBadgeClass(request.status)}>
                                        {request.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">
                                      {request.email} • {request.phone_number}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {request.governorate}, {request.delegation}
                                    </p>
                                    {request.status === 'rejected' && request.rejection_reason && (
                                      <p className="text-xs text-red-400 mt-1 italic">
                                        Reason: {request.rejection_reason}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                      Request #{request.request_number} • {formatDate(request.created_at)}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {request.latitude && request.longitude && (
                                      <MapPin className="h-4 w-4 text-red-400" />
                                    )}
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
            <div className="lg:col-span-1">
              <Card className="bg-gray-900/50 backdrop-blur-sm border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-white font-mono">REQUEST_LOCATIONS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {mapError ? (
                      <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center text-red-400 rounded-lg">
                        {mapError}
                      </div>
                    ) : requests.filter(req => req.latitude && req.longitude).length === 0 ? (
                      <div className="h-80 rounded-lg border border-white/10 bg-gray-900/20 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No requests with location data</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div
                          ref={mapContainer}
                          className="w-full h-80 rounded-lg border border-white/10 overflow-hidden"
                        />
                        
                        {/* Legend */}
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-red-500/30">
                          <div className="text-white text-sm font-semibold mb-2">Status Legend</div>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                              <span className="text-yellow-400">Pending</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                              <span className="text-green-400">Approved</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                              <span className="text-red-400">Rejected</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900/95 backdrop-blur-md rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Request Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Request Number</label>
                      <p className="text-sm text-white font-mono bg-gray-800/50 px-2 py-1 rounded">{selectedRequest.request_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Full Name</label>
                      <p className="text-sm text-white">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Email</label>
                      <p className="text-sm text-white">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Phone Number</label>
                      <p className="text-sm text-white">{selectedRequest.phone_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">CIN Number</label>
                      <p className="text-sm text-white">{selectedRequest.cin || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Location</label>
                      <p className="text-sm text-white">{selectedRequest.governorate}, {selectedRequest.delegation}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Status</label>
                      <Badge className={getStatusBadgeClass(selectedRequest.status)}>
                        {selectedRequest.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Created</label>
                      <p className="text-sm text-white">{formatDate(selectedRequest.created_at)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Last Updated</label>
                      <p className="text-sm text-white">{formatDate(selectedRequest.updated_at)}</p>
                    </div>
                  </div>
                </div>

                {/* CIN Documents */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">CIN Documents</h3>
                  <div className="space-y-4">
                    {selectedRequest.cin_front_url && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Front Side</label>
                        <div className="relative group cursor-pointer" onClick={() => handleImageClick(selectedRequest.cin_front_url!, 'CIN Front')}>
                          <img
                            src={selectedRequest.cin_front_url}
                            alt="CIN Front"
                            className="w-full h-32 object-cover rounded-lg border border-white/20 group-hover:border-red-500/50 transition-colors"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <ZoomIn className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedRequest.cin_back_url && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Back Side</label>
                        <div className="relative group cursor-pointer" onClick={() => handleImageClick(selectedRequest.cin_back_url!, 'CIN Back')}>
                          <img
                            src={selectedRequest.cin_back_url}
                            alt="CIN Back"
                            className="w-full h-32 object-cover rounded-lg border border-white/20 group-hover:border-red-500/50 transition-colors"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <ZoomIn className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    {!selectedRequest.cin_front_url && !selectedRequest.cin_back_url && (
                      <p className="text-sm text-gray-500">No CIN documents uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Map */}
              {selectedRequest.latitude && selectedRequest.longitude && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/20 pb-2">Location</h3>
                  <div className="w-full h-64 rounded-lg border border-white/20 overflow-hidden">
                    <LocationMap 
                      latitude={selectedRequest.latitude}
                      longitude={selectedRequest.longitude}
                      requestName={`${selectedRequest.first_name} ${selectedRequest.last_name}`}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Coordinates: {selectedRequest.latitude}, {selectedRequest.longitude}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="mt-8 flex items-center justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRequest(null)}
                    className="border-white/20 text-black hover:bg-white/10 hover:text-white "
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectClick(selectedRequest.request_number)}
                    disabled={updatingStatus === selectedRequest.request_number}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {updatingStatus === selectedRequest.request_number ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest.request_number)}
                    disabled={updatingStatus === selectedRequest.request_number}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updatingStatus === selectedRequest.request_number ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
              )}

              {/* Approved Request Information */}
              {selectedRequest.status === 'approved' && (
                <div className="mt-8 p-6 bg-green-600/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-400">Request Approved!</h3>
                      <p className="text-white/80 text-sm">This applicant can now access the station portal</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Next Steps for Applicant:</h4>
                      <div className="space-y-2 text-sm text-white/80">
                        <p>• Go to <span className="text-blue-400 font-mono">/station-partnership/login</span></p>
                        <p>• Enter your CIN number: <span className="text-green-400 font-mono font-bold">{selectedRequest.cin}</span></p>
                        <p>• You'll receive an SMS verification code on your phone</p>
                        <p>• Complete the verification to access your station portal</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-blue-400 font-medium mb-2">Important Information:</h4>
                      <div className="space-y-1 text-sm text-white/80">
                        <p>• CIN Number: <span className="text-white font-mono font-bold">{selectedRequest.cin}</span></p>
                        <p>• Phone: <span className="text-white font-mono">{selectedRequest.phone_number}</span></p>
                        <p>• Email: <span className="text-white font-mono">{selectedRequest.email}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejected Request Information */}
              {selectedRequest.status === 'rejected' && (
                <div className="mt-8 p-6 bg-red-600/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-400">Request Rejected</h3>
                      <p className="text-white/80 text-sm">This application was not approved</p>
                    </div>
                  </div>
                  
                  {selectedRequest.rejection_reason && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Rejection Reason:</h4>
                      <p className="text-white/80 text-sm">{selectedRequest.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60]">
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-red-400 hover:bg-red-500/10 z-10"
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={enlargedImage.url}
              alt={enlargedImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <p className="text-center text-white mt-4 text-lg font-medium">{enlargedImage.alt}</p>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60]">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-red-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Rejection Reason</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRejectionModal(false)}
                className="text-white hover:text-red-400 hover:bg-red-500/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Please provide a reason for rejecting this request:
                </label>
                
                {/* Rejection Reason Suggestions */}
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Common rejection reasons:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Incomplete documentation',
                      'Invalid location coordinates',
                      'Area already covered',
                      'Insufficient business plan',
                      'Duplicate application',
                      'Location not suitable',
                      'Missing required information',
                      'Does not meet criteria',
                      'Business hours not suitable',
                      'Competition in area',
                      'Technical requirements not met',
                      'Application incomplete'
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setRejectionReason(suggestion)}
                        className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-red-500/50 text-gray-300 hover:text-red-400 rounded transition-all duration-200 truncate"
                        title={suggestion}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason or click a suggestion above..."
                    className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 resize-none mr-2"
                    rows={4}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectionReason('')}
                    disabled={!rejectionReason.trim()}
                    className="border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 h-8 px-2"
                  >
                    Clear
                  </Button>
                </div>
                <p className="text-xs text-gray-500 italic">
                  💡 Click any suggestion above to use it, or customize it in the text area
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionModal(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectSubmit}
                  disabled={!rejectionReason.trim() || updatingStatus === requestToReject}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {updatingStatus === requestToReject ? 'Rejecting...' : 'Reject Request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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