'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Clock, CheckCircle, XCircle, MapPin, User, Mail, Phone, History, Copy, ExternalLink } from 'lucide-react'
import Map from '@/components/map/Map'
import { StationPartnershipService } from '@/lib/station-partnership'
import type { StationPartnershipRequest } from '@/lib/supabase'

interface SavedRequest {
  requestNumber: string
  submittedAt: string
  status: string
}

export default function RequestStatusChecker() {
  const [requestNumber, setRequestNumber] = useState('')
  const [request, setRequest] = useState<StationPartnershipRequest | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([])
  const [showSavedRequests, setShowSavedRequests] = useState(false)

  // Load saved requests from localStorage on component mount
  useEffect(() => {
    loadSavedRequests()
  }, [])

  const loadSavedRequests = () => {
    try {
      const savedRequestsList: SavedRequest[] = []

      // Get all localStorage keys that start with 'request-'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('request-')) {
          const requestData = localStorage.getItem(key)
          if (requestData) {
            try {
              const parsed = JSON.parse(requestData)
              if (parsed.requestNumber) {
                savedRequestsList.push({
                  requestNumber: parsed.requestNumber,
                  submittedAt: parsed.submittedAt || new Date().toISOString(),
                  status: parsed.status || 'pending'
                })
              }
            } catch (e) {
              console.error('Error parsing saved request:', e)
            }
          }
        }
      }

      // Sort by submission date (newest first)
      savedRequestsList.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

      setSavedRequests(savedRequestsList)
    } catch (error) {
      console.error('Error loading saved requests:', error)
    }
  }

  const handleUseSavedRequest = (savedRequest: SavedRequest) => {
    setRequestNumber(savedRequest.requestNumber)
    setShowSavedRequests(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleSearch = async () => {
    if (!requestNumber.trim()) {
      setError('Please enter a request number')
      return
    }

    setIsLoading(true)
    setError('')
    setHasSearched(true)

    try {
      const result = await StationPartnershipService.getRequestByNumber(requestNumber.trim())
      setRequest(result)
      
      if (!result) {
        setError('Request not found. Please check your request number.')
      }
    } catch (error) {
      console.error('Error fetching request:', error)
      setError('Failed to fetch request status. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
          icon: <Clock className="w-4 h-4" />,
          label: 'Pending Review'
        }
      case 'approved':
        return {
          color: 'bg-green-600/20 text-green-400 border-green-500/30',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Approved'
        }
      case 'rejected':
        return {
          color: 'bg-red-600/20 text-red-400 border-red-500/30',
          icon: <XCircle className="w-4 h-4" />,
          label: 'Rejected'
        }
      default:
        return {
          color: 'bg-gray-600/20 text-gray-400 border-gray-500/30',
          icon: <Clock className="w-4 h-4" />,
          label: 'Unknown'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Saved Requests Helper */}
      {savedRequests.length > 0 && !showSavedRequests && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <History className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Quick Access to Your Requests</h3>
          </div>
          <p className="text-gray-400 mb-4">
            We found {savedRequests.length} saved request{savedRequests.length !== 1 ? 's' : ''} from your browser.
            Click below to quickly access your request numbers.
          </p>
          <Button
            onClick={() => setShowSavedRequests(true)}
            variant="outline"
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
          >
            <History className="mr-2 h-4 w-4" />
            View Saved Requests ({savedRequests.length})
          </Button>
        </div>
      )}

      {/* Saved Requests List */}
      {showSavedRequests && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <History className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Your Saved Requests</h3>
            </div>
            <Button
              onClick={() => setShowSavedRequests(false)}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {savedRequests.map((savedRequest, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-black/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-mono font-semibold">
                      {savedRequest.requestNumber}
                    </span>
                    <Button
                      onClick={() => copyToClipboard(savedRequest.requestNumber)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-blue-400 p-1 h-auto"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Submitted: {new Date(savedRequest.submittedAt).toLocaleDateString()}</span>
                    <Badge
                      variant="outline"
                      className={`${getStatusInfo(savedRequest.status).color} text-xs`}
                    >
                      {getStatusInfo(savedRequest.status).icon}
                      {getStatusInfo(savedRequest.status).label}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => handleUseSavedRequest(savedRequest)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Use This Request
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 Tip: These requests are saved in your browser's local storage. If you're on a different device or browser, you'll need to manually enter your request number.
            </p>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
            <Search className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Check Your Application Status</h3>
        </div>

        <p className="text-gray-400 mb-6">
          Enter your request number to check the status of your partnership application.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
            <Label htmlFor="requestNumber" className="text-white font-medium mb-2 block">
              Request Number
            </Label>
              <Input
                id="requestNumber"
              placeholder="Enter your request number (e.g., SPR-1234567890-123)"
                value={requestNumber}
                onChange={(e) => setRequestNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-black/20 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
            <p className="text-xs text-gray-500 mt-2">
              Your request number should start with "SPR-" followed by numbers and a random code.
            </p>
            </div>
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
          </div>

          {error && (
          <div className="mt-4 bg-red-600/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {hasSearched && !isLoading && (
        <>
          {request ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                  <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Request Details</h3>
                  <p className="text-gray-400">Request #{request.request_number}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                  className={`${getStatusInfo(request.status).color} flex items-center gap-2 px-3 py-1`}
                  >
                    {getStatusInfo(request.status).icon}
                    {getStatusInfo(request.status).label}
                  </Badge>
                </div>

              {/* Personal Information */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Personal Information</h4>
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-black/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-medium">Name:</span>
                    <span className="text-white">{request.first_name} {request.last_name}</span>
                    </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400 font-medium">Email:</span>
                    <span className="text-white">{request.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400 font-medium">Phone:</span>
                    <span className="text-white">{request.phone_number}</span>
                    </div>
                  </div>
                </div>

              {/* Station Location */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-green-400" />
                      </div>
                  <h4 className="text-lg font-semibold text-white">Station Location</h4>
                      </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3 text-sm bg-black/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-medium">Governorate:</span>
                      <span className="text-white">{request.governorate}</span>
                        </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-medium">Delegation:</span>
                      <span className="text-white">{request.delegation}</span>
                    </div>
                    {request.latitude && request.longitude && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-medium">Coordinates:</span>
                        <span className="text-white font-mono">
                          {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                  {request.latitude && request.longitude && (
                    <div className="border border-white/20 rounded-lg overflow-hidden">
                        <Map
                          latitude={request.latitude}
                          longitude={request.longitude}
                          zoom={14}
                          className="h-48"
                          showMarker={true}
                          markerColor="#3B82F6"
                        />
                      </div>
                    )}
                  </div>
                </div>

              {/* Request Timeline */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    </div>
                  <h4 className="text-lg font-semibold text-white">Request Timeline</h4>
                      </div>
                <div className="space-y-3 text-sm bg-black/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Submitted:</span>
                    <span className="text-white">
                      {request.created_at && formatDate(request.created_at)}
                    </span>
                  </div>
                  {request.updated_at && request.updated_at !== request.created_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Last Updated:</span>
                      <span className="text-white">
                        {formatDate(request.updated_at)}
                      </span>
                    </div>
                  )}
                  </div>
                </div>

              {/* Status Message */}
              <div className={`p-6 rounded-lg ${
                request.status === 'pending' ? 'bg-yellow-600/10 border border-yellow-500/30' :
                request.status === 'approved' ? 'bg-green-600/10 border border-green-500/30' :
                request.status === 'rejected' ? 'bg-red-600/10 border border-red-500/30' :
                'bg-gray-600/10 border border-gray-500/30'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  request.status === 'pending' ? 'text-yellow-400' :
                  request.status === 'approved' ? 'text-green-400' :
                  request.status === 'rejected' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  What's Next?
                </h4>
                  {request.status === 'pending' && (
                  <p className="text-gray-300 text-sm">
                    Your application is currently under review. Our team will evaluate your request and respond within 5-7 business days. You will be notified by email as soon as a decision is made.
                    </p>
                  )}
                  {request.status === 'approved' && (
                    <div className="space-y-4">
                      <p className="text-green-300 text-sm">
                        Congratulations! Your station partnership request has been approved. You can now access the station portal.
                      </p>
                      
                      <div className="bg-white/5 rounded-lg p-4">
                        <h5 className="text-white font-medium mb-2">Next Steps:</h5>
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>• Go to <span className="text-blue-400 font-mono">/station-partnership/login</span></p>
                          <p>• Enter your CIN number: <span className="text-green-400 font-mono font-bold">{request.cin}</span></p>
                          <p>• You'll receive an SMS verification code on your phone</p>
                          <p>• Complete the verification to access your station portal</p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                        <h5 className="text-blue-400 font-medium mb-2">Your Login Details:</h5>
                        <div className="space-y-1 text-sm text-gray-300">
                          <p>• CIN Number: <span className="text-white font-mono font-bold">{request.cin}</span></p>
                          <p>• Phone: <span className="text-white font-mono">{request.phone_number}</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                  {request.status === 'rejected' && (
                  <p className="text-red-300 text-sm">
                    Unfortunately, your application has been rejected. If you believe this is an error or would like to discuss the decision, please contact our support team.
                    </p>
                  )}
                </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Request Not Found</h3>
              <p className="text-gray-400 mb-4">
                No request found with the provided number. Please check your request number and try again.
              </p>
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  💡 Make sure your request number starts with "SPR-" and includes the full code.
                  If you can't find your request, try using the saved requests feature above.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
