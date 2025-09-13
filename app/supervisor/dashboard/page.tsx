'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WaslaLogo } from '@/components/WaslaLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  LogOut, 
  Users, 
  MapPin, 
  Calendar, 
  Download, 
  RefreshCw, 
  Settings, 
  Phone, 
  Mail, 
  Globe,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Car,
  Route,
  FileText,
  Headphones,
  Hexagon,
  Cpu,
  Terminal,
  Network
} from 'lucide-react'

interface Station {
  id: string
  name: string
  nameAr: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  localServerIp: string | null
  isActive: boolean
  isOnline: boolean
  lastHeartbeat: string | null
  governorate: {
    id: string
    name: string
    nameAr: string | null
  }
  delegation: {
    id: string
    name: string
    nameAr: string | null
  }
  staff: Array<{
    id: string
    cin: string
    firstName: string
    lastName: string
    phoneNumber: string
    role: string
    isActive: boolean
  }>
  _count: {
    departureBookings: number
    destinationBookings: number
    queueEntries: number
  }
}

interface AppVersion {
  version: string
  downloadUrl: string
  releaseNotes: string
  releaseDate: string
  isLatest: boolean
}

interface InstalledApp {
  isInstalled: boolean
  version: string | null
  updateAvailable: boolean
  latestVersion: string
}

export default function SupervisorDashboard() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appVersion, setAppVersion] = useState<AppVersion | null>(null)
  const [installedApp, setInstalledApp] = useState<InstalledApp>({
    isInstalled: false,
    version: null,
    updateAvailable: false,
    latestVersion: ''
  })
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [checkingApp, setCheckingApp] = useState(false)

  // Fetch station data from central server
  const fetchStationData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const authToken = localStorage.getItem('authToken')
      if (!authToken) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || 'http://localhost:5000'}/api/v1/stations/my/station`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch station data')
      }

      const result = await response.json()
      setStation(result.data)
    } catch (error) {
      console.error('Error fetching station data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch station data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch staff data from central server
  const fetchStaffData = async () => {
    try {
      const authToken = localStorage.getItem('authToken')
      if (!authToken) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || 'http://localhost:5000'}/api/v1/staff`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        // Update station with fresh staff data
        if (station) {
          setStation(prev => prev ? { ...prev, staff: result.data } : null)
        }
      }
    } catch (error) {
      console.error('Error fetching staff data:', error)
    }
  }

  // Mock app version data (replace with real API call later)
  const fetchAppVersion = async () => {
    // Simulate API call
    setAppVersion({
      version: '2.1.4',
      downloadUrl: 'https://downloads.louaj.tn/desktop-app/latest',
      releaseNotes: 'Bug fixes and performance improvements',
      releaseDate: '2025-08-23',
      isLatest: true
    })
  }

  // Check if desktop app is installed and get its version
  const checkInstalledApp = async () => {
    try {
      setCheckingApp(true)
      
      // Try to detect if the app is installed using various methods
      const detectionResults = await Promise.allSettled([
        // Method 1: Check for Tauri app protocol
        checkTauriProtocol(),
        // Method 2: Check for Electron app
        checkElectronApp(),
        // Method 3: Check for Windows registry (if on Windows)
        checkWindowsRegistry(),
        // Method 4: Check for macOS app bundle
        checkMacOSApp(),
        // Method 5: Check for Linux app
        checkLinuxApp()
      ])

      let isInstalled = false
      let detectedVersion = null

      // Process detection results
      for (const result of detectionResults) {
        if (result.status === 'fulfilled' && result.value) {
          isInstalled = true
          detectedVersion = result.value.version
          break
        }
      }

      // Update installed app state
      setInstalledApp(prev => ({
        ...prev,
        isInstalled,
        version: detectedVersion,
        latestVersion: appVersion?.version || '2.1.4',
        updateAvailable: Boolean(isInstalled && detectedVersion && appVersion?.version && 
          compareVersions(detectedVersion, appVersion.version) < 0)
      }))

    } catch (error) {
      console.error('Error checking installed app:', error)
    } finally {
      setCheckingApp(false)
    }
  }

  // Check for Tauri app protocol
  const checkTauriProtocol = async (): Promise<{ version: string } | null> => {
    try {
      // Try to use Tauri API if available
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        // Check if Tauri is available in global scope
        const tauriVersion = (window as any).__TAURI_VERSION__ || '1.0.0'
        return { version: tauriVersion }
      }
      return null
    } catch {
      return null
    }
  }

  // Check for Electron app
  const checkElectronApp = async (): Promise<{ version: string } | null> => {
    try {
      if (typeof window !== 'undefined' && (window as any).electron) {
        const version = (window as any).electron.getVersion()
        return { version }
      }
      return null
    } catch {
      return null
    }
  }

  // Check Windows registry (simulated)
  const checkWindowsRegistry = async (): Promise<{ version: string } | null> => {
    try {
      // This would require a native module or Tauri API
      // For now, we'll simulate it
      if (navigator.platform.includes('Win')) {
        // Simulate checking Windows registry
        return null
      }
      return null
    } catch {
      return null
    }
  }

  // Check macOS app bundle
  const checkMacOSApp = async (): Promise<{ version: string } | null> => {
    try {
      if (navigator.platform.includes('Mac')) {
        // This would require native macOS integration
        return null
      }
      return null
    } catch {
      return null
    }
  }

  // Check Linux app
  const checkLinuxApp = async (): Promise<{ version: string } | null> => {
    try {
      if (navigator.platform.includes('Linux')) {
        // This would require native Linux integration
        return null
      }
      return null
    } catch {
      return null
    }
  }

  // Compare version strings (semantic versioning)
  const compareVersions = (version1: string, version2: string): number => {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }
    
    return 0
  }

  // Update station status
  const updateStationStatus = async (isOnline: boolean) => {
    try {
      setUpdatingStatus(true)
      const authToken = localStorage.getItem('authToken')
      if (!authToken) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || 'http://localhost:5000'}/api/v1/stations/my/station`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ isOnline })
      })

      if (response.ok) {
        // Refresh station data
        await fetchStationData()
      }
    } catch (error) {
      console.error('Error updating station status:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    const userProfileData = localStorage.getItem('userProfile')
    
    if (!authToken || !userProfileData) {
      router.push('/station-partnership/login')
      return
    }

    try {
      const profile = JSON.parse(userProfileData)
      if (profile.role !== 'SUPERVISOR') {
        router.push('/station-partnership/login')
        return
      }
      setUserProfile(profile)
      
      // Fetch data after authentication
      fetchStationData()
      fetchAppVersion()
      checkInstalledApp()
    } catch (error) {
      router.push('/station-partnership/login')
    }
  }, [router])

  // Refresh data every 30 seconds
  useEffect(() => {
    if (station) {
      const interval = setInterval(() => {
        fetchStationData()
        fetchStaffData()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [station])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userProfile')
    router.push('/station-partnership/login')
  }

  const handleDownloadApp = () => {
    if (appVersion?.downloadUrl) {
      window.open(appVersion.downloadUrl, '_blank')
    }
  }

  const handleContactSupport = () => {
    // Open support contact methods
    window.open('mailto:support@louaj.tn', '_blank')
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading station data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchStationData} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const activeWorkers = station?.staff.filter(s => s.isActive) || []
  const totalBookings = (station?._count.departureBookings || 0) + (station?._count.destinationBookings || 0)
  const queueVehicles = station?._count.queueEntries || 0

  return (
    <div className="min-h-screen relative bg-black">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black/80 to-blue-950/20" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-black/80 backdrop-blur-md border-b border-cyan-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <WaslaLogo size={32} variant="simple" />
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white font-mono">Wasla</h1>
                  <span className="text-xl font-bold text-orange-400 font-arabic">وصلة</span>
                  <span className="text-cyan-400 font-mono">SUPERVISOR</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 font-mono">
                  {userProfile.firstName} {userProfile.lastName}
                </span>
                <span className="text-sm text-cyan-400 font-mono">
                  {station?.name}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-mono"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  LOGOUT
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 font-mono">SUPERVISOR_DASHBOARD</h2>
              <p className="text-gray-400 font-mono">MANAGING {station?.name}</p>
            </div>

            {/* Station Status & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Station Status Card */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center font-mono">
                    <div className={`h-3 w-3 rounded-full mr-2 ${station?.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    STATION_STATUS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status:</span>
                      <Badge className={station?.isOnline ? 'bg-green-600' : 'bg-red-600'}>
                        {station?.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Last Heartbeat:</span>
                      <span className="text-white text-sm">
                        {station?.lastHeartbeat ? new Date(station.lastHeartbeat).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Local Server:</span>
                      <span className="text-white text-sm font-mono">
                        {station?.localServerIp || 'Not configured'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button 
                      onClick={() => updateStationStatus(!station?.isOnline)}
                      disabled={updatingStatus}
                      className={`w-full ${station?.isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {updatingStatus ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : station?.isOnline ? (
                        <WifiOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Wifi className="h-4 w-4 mr-2" />
                      )}
                      {station?.isOnline ? 'Go Offline' : 'Go Online'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Location Card */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center font-mono">
                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30 mr-2">
                      <MapPin className="h-5 w-5 text-cyan-400" />
                    </div>
                    LOCATION
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Station:</span>
                      <p className="text-white font-medium">{station?.name}</p>
                      {station?.nameAr && (
                        <p className="text-blue-400 text-sm">{station.nameAr}</p>
                      )}
                  </div>
                    <div>
                      <span className="text-gray-400">Address:</span>
                      <p className="text-white">{station?.address || 'No address set'}</p>
                </div>
                <div>
                      <span className="text-gray-400">Area:</span>
                      <p className="text-white">
                        {station?.delegation?.name} {station?.delegation?.nameAr && `(${station.delegation.nameAr})`}
                      </p>
                      <p className="text-white">
                        {station?.governorate?.name} {station?.governorate?.nameAr && `(${station.governorate.nameAr})`}
                      </p>
                    </div>
                    {station?.latitude && station?.longitude && (
                      <div>
                        <span className="text-gray-400">Coordinates:</span>
                        <p className="text-white text-sm font-mono">
                          {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* App Management Card */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between font-mono">
                    <span className="flex items-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30 mr-2">
                        <Download className="h-5 w-5 text-purple-400" />
                      </div>
                      DESKTOP_APP
                    </span>
                    <Button 
                      onClick={checkInstalledApp}
                      variant="outline"
                      size="sm"
                      disabled={checkingApp}
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 font-mono"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${checkingApp ? 'animate-spin' : ''}`} />
                      {checkingApp ? 'CHECKING...' : 'CHECK'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* App Installation Status */}
                    <div>
                      <span className="text-gray-400">Installation Status:</span>
                      <div className="flex items-center mt-1">
                        {installedApp.isInstalled ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Installed
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Installed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Installed Version */}
                    {installedApp.isInstalled && installedApp.version && (
                      <div>
                        <span className="text-gray-400">Installed Version:</span>
                        <p className="text-white font-medium">{installedApp.version}</p>
                      </div>
                    )}

                    {/* Latest Available Version */}
                    <div>
                      <span className="text-gray-400">Latest Version:</span>
                      <p className="text-white font-medium">{appVersion?.version || 'Unknown'}</p>
                    </div>

                    {/* Update Status */}
                    {installedApp.isInstalled && (
                      <div>
                        <span className="text-gray-400">Update Status:</span>
                        <Badge className={installedApp.updateAvailable ? 'bg-yellow-600' : 'bg-green-600'}>
                          {installedApp.updateAvailable ? 'Update Available' : 'Up to Date'}
                        </Badge>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {!installedApp.isInstalled ? (
                        <Button 
                          onClick={handleDownloadApp}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download & Install
                        </Button>
                      ) : installedApp.updateAvailable ? (
                        <Button 
                          onClick={handleDownloadApp}
                          className="w-full bg-yellow-600 hover:bg-yellow-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Update
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleDownloadApp}
                          variant="outline"
                          className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Re-download
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        onClick={handleContactSupport}
                        className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Headphones className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </div>

                    {/* Additional Info */}
                    {appVersion?.releaseNotes && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400 text-sm">Release Notes:</span>
                        <p className="text-white text-sm mt-1">{appVersion.releaseNotes}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          Released: {appVersion.releaseDate}
                  </p>
                </div>
                    )}
              </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-900/50 backdrop-blur-sm border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/20">
                <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                    <Users className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400 font-mono">ACTIVE_WORKERS</p>
                      <p className="text-2xl font-bold text-white">{activeWorkers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/50 backdrop-blur-sm border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/20">
                <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                    <Calendar className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 font-mono">TOTAL_BOOKINGS</p>
                      <p className="text-2xl font-bold text-white">{totalBookings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                      <Car className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 font-mono">QUEUE_VEHICLES</p>
                      <p className="text-2xl font-bold text-white">{queueVehicles}</p>
                </div>
              </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-sm border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/20">
                <CardContent className="p-6">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                      <Route className="h-6 w-6 text-purple-400" />
                    </div>
                  <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400 font-mono">ROUTES</p>
                      <p className="text-2xl font-bold text-white">-</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workers List */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-cyan-500/30 mb-8 hover:shadow-2xl hover:shadow-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between font-mono">
                  <span>STATION_WORKERS ({activeWorkers.length})</span>
                  <Button 
                    onClick={fetchStaffData}
                    variant="outline"
                    size="sm"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-mono"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    REFRESH
                </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeWorkers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No workers assigned to this station</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeWorkers.map((worker) => (
                      <div key={worker.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">
                            {worker.firstName} {worker.lastName}
                          </h4>
                          <Badge className={worker.isActive ? 'bg-green-600' : 'bg-red-600'}>
                            {worker.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-400">CIN: <span className="text-white font-mono">{worker.cin}</span></p>
                          <p className="text-gray-400">Phone: <span className="text-white">{worker.phoneNumber}</span></p>
                          <p className="text-gray-400">Role: <span className="text-white capitalize">{worker.role.toLowerCase()}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Support Section */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center font-mono">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center border border-orange-500/30 mr-2">
                    <Headphones className="h-5 w-5 text-orange-400" />
                  </div>
                  CUSTOMER_SUPPORT_&_B2B_SERVICES
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Phone className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                    <h4 className="text-white font-medium mb-2">Phone Support</h4>
                    <p className="text-gray-400 text-sm mb-3">24/7 technical support</p>
                    <p className="text-white font-mono">+216 XX XXX XXX</p>
                  </div>
                  
                  <div className="text-center">
                    <Mail className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                    <h4 className="text-white font-medium mb-2">Email Support</h4>
                    <p className="text-gray-400 text-sm mb-3">Business inquiries & support</p>
                    <p className="text-white">support@louaj.tn</p>
                  </div>
                  
                  <div className="text-center">
                    <Globe className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                    <h4 className="text-white font-medium mb-2">B2B Portal</h4>
                    <p className="text-gray-400 text-sm mb-3">Enterprise solutions</p>
                    <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                      Access Portal
                </Button>
              </div>
            </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}