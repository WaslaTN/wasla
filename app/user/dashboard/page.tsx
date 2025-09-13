'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WaslaLogo } from '@/components/WaslaLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import {
  Home,
  LogOut,
  Map,
  Calendar,
  User,
  Car,
  Clock,
  CreditCard,
  TrendingUp,
  Route,
  History,
  Plus,
  ArrowRight,
  Star,
  CheckCircle,
  AlertCircle,
  Moon,
  Ticket,
  Bell,
  Settings,
  MapPin,
  Zap,
  Shield,
  Award,
  Activity,
  Timer,
  Navigation,
  Wallet,
  Users,
  Sparkles,
  Hexagon,
  Cpu,
  Network,
  Terminal
} from 'lucide-react'

export default function DefaultDashboard() {
  const router = useRouter()
  const { t } = useLanguage()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [latestTicket, setLatestTicket] = useState<any>(null)
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    totalSpent: 0
  })

  useEffect(() => {
    const authToken = localStorage.getItem('userToken')
    const userProfileData = localStorage.getItem('userProfile')
    
    if (!authToken || !userProfileData) {
      router.push('/user/auth/login')
      return
    }

    try {
      const profile = JSON.parse(userProfileData)
      setUserProfile(profile)
    } catch (error) {
      router.push('/user/auth/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('userToken')
    localStorage.removeItem('userProfile')
    router.push('/user/auth/login')
  }

  // Fetch user bookings and calculate stats
  const fetchUserData = async () => {
    if (!userProfile || !userProfile.id) return

    setLoading(true)
    try {
      const token = localStorage.getItem('userToken')
      
      // Fetch user bookings from central server
      const response = await fetch(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || 'http://localhost:5000'}/api/v1/central-bookings/user/${userProfile.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const bookings = data.data || []
        
        // Filter only completed bookings for recent transactions
        const completedBookings = bookings.filter((booking: any) => 
          booking.status === 'completed' || booking.paymentStatus === 'completed'
        )
        
        // Calculate stats
        const totalTrips = bookings.length
        const completedTrips = completedBookings.length
        const totalSpent = completedBookings.reduce((sum: number, booking: any) => sum + (booking.totalAmount || 0), 0)
        
        setStats({
          totalTrips,
          completedTrips,
          totalSpent: parseFloat(totalSpent.toFixed(2))
        })
        
        // Format recent transactions (latest 4)
        const recentTransactions = completedBookings
          .slice(0, 4)
          .map((booking: any) => ({
            id: booking.id,
            type: 'booking',
            status: 'completed',
            amount: booking.totalAmount || 0,
            date: new Date(booking.createdAt).toLocaleDateString(),
            description: `${booking.departureStation?.name || 'Unknown'} to ${booking.destinationStation?.name || 'Unknown'}`,
            paymentRef: booking.paymentReference || booking.id
          }))
        
        setRecentTransactions(recentTransactions)
      } else {
        console.error('Failed to fetch user bookings')
        // Fallback to empty data
        setStats({ totalTrips: 0, completedTrips: 0, totalSpent: 0 })
        setRecentTransactions([])
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Fallback to empty data
      setStats({ totalTrips: 0, completedTrips: 0, totalSpent: 0 })
      setRecentTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch latest paid ticket
  const fetchLatestTicket = async () => {
    if (!userProfile || !userProfile.id) return

    try {
      const token = localStorage.getItem('userToken')

      const response = await fetch(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || 'http://localhost:5000'}/api/v1/central-bookings/latest-paid-ticket`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setLatestTicket(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching latest ticket:', error)
    }
  }

  useEffect(() => {
    if (userProfile) {
      fetchUserData()
      fetchLatestTicket()
    }
  }, [userProfile])

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Cyberpunk Navigation */}
      <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-orange-500/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo & Brand */}
            <div className="flex items-center">
              <WaslaLogo size={32} variant="simple" className="mr-2 sm:mr-3" />
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Wasla
                </h1>
                <span className="text-lg font-bold text-orange-400 font-arabic">وصلة</span>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <LanguageSwitcher />
              
              <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-lg border border-orange-500/20">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-medium font-mono">
                    {userProfile.firstName?.charAt(0)}{userProfile.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-white text-sm font-medium font-mono">
                    {userProfile.firstName} {userProfile.lastName}
                  </p>
                  <p className="text-gray-400 text-xs font-mono">{t('userActive')}</p>
                </div>
              </div>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 border border-orange-500/20 p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Cyberpunk Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-1 sm:mb-2 font-mono">
                {t('systemAccess')}: {new Date().getHours() < 12 ? t('morning') : new Date().getHours() < 18 ? t('afternoon') : t('evening')}, {userProfile.firstName?.toUpperCase()}
              </h2>
              <p className="text-gray-400 text-base sm:text-lg font-mono">{t('transportNetworkReady')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-orange-500/20 to-red-600/20 text-orange-400 border-orange-500/30 px-3 py-1 font-mono">
                <Cpu className="w-3 h-3 mr-1" />
                USER_ACTIVE
              </Badge>
            </div>
          </div>
        </div>

        {/* Cyberpunk E-Ticket */}
        {latestTicket && (
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 font-mono">ACTIVE_TICKET</h3>
                <p className="text-gray-400 text-sm sm:text-base font-mono">TRANSPORT_READY</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => router.push('/user/booking-history')}
                className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 border border-orange-500/20 self-start sm:self-auto font-mono"
              >
                VIEW_ALL
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 rounded-2xl p-4 sm:p-8 relative overflow-hidden shadow-2xl shadow-orange-500/10">
              {/* Cyberpunk ticket perforation effect */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full -ml-3 border-2 border-orange-500/50"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full -mr-3 border-2 border-orange-500/50"></div>
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <Hexagon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent font-mono">LOUAJ</h3>
                      <p className="text-gray-400 text-xs sm:text-sm font-medium font-mono">DIGITAL_BOARDING_PASS</p>
                    </div>
                  </div>
                  
                  <Badge className="bg-gradient-to-r from-orange-500/20 to-red-600/20 text-orange-400 border-orange-500/30 px-3 sm:px-4 py-1.5 sm:py-2 text-sm self-start sm:self-auto font-mono">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    PAID
                  </Badge>
                </div>

                {/* Cyberpunk Route Information */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1 font-mono">{latestTicket.departureStation.name}</div>
                      <div className="text-gray-400 text-sm font-mono">{latestTicket.departureStation.governorate?.name || 'N/A'}</div>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"></div>
                      <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
                      <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                      <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-l from-red-500 to-orange-500"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
                    </div>
                    
                    <div className="text-center sm:text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1 font-mono">{latestTicket.destinationStation.name}</div>
                      <div className="text-gray-400 text-sm font-mono">{latestTicket.destinationStation.governorate?.name || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Cyberpunk Quick Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-orange-500/30">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                    </div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">DATE</div>
                    <div className="text-white font-semibold text-sm sm:text-base font-mono">
                      {new Date(latestTicket.journeyDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-purple-500/30">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                    </div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">TIME</div>
                    <div className="text-white font-semibold text-sm sm:text-base font-mono">
                      {new Date(latestTicket.journeyDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-emerald-500/30">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    </div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">PASSENGERS</div>
                    <div className="text-white font-semibold text-sm sm:text-base font-mono">{latestTicket.seatsBooked}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-amber-500/30">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                    </div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-mono">TOTAL</div>
                    <div className="text-white font-semibold text-sm sm:text-base font-mono">{latestTicket.totalAmount} DT</div>
                  </div>
                </div>

                {/* Cyberpunk Action */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => router.push(`/user/booking-details/${latestTicket.paymentReference || latestTicket.id}`)}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto font-mono shadow-lg shadow-orange-500/25"
                  >
                    VIEW_FULL_TICKET
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 sm:mb-12">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">Quick Actions</h3>
            <p className="text-slate-400 text-sm sm:text-base">What would you like to do today?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Book New Trip */}
            <Card 
              className="group bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 hover:border-orange-400/50 hover:bg-gradient-to-br hover:from-gray-800/90 hover:to-gray-900/90 transition-all duration-200 cursor-pointer shadow-lg shadow-orange-500/10"
              onClick={() => router.push('/user/book-trip')}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-orange-500/30 group-hover:bg-gradient-to-br group-hover:from-orange-500/30 group-hover:to-red-600/30 transition-colors">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2 font-mono">BOOK_TRIP</h3>
                <p className="text-gray-400 text-sm font-mono">INITIATE_JOURNEY</p>
              </CardContent>
            </Card>

            {/* Overnight Booking */}
            <Card 
              className="group bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/30 hover:border-purple-400/50 hover:bg-gradient-to-br hover:from-gray-800/90 hover:to-gray-900/90 transition-all duration-200 cursor-pointer shadow-lg shadow-purple-500/10"
              onClick={() => router.push('/user/overnight-booking')}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-purple-500/30 group-hover:bg-gradient-to-br group-hover:from-purple-500/30 group-hover:to-blue-600/30 transition-colors">
                    <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2 font-mono">NIGHT_TRAVEL</h3>
                <p className="text-gray-400 text-sm font-mono">EVENING_JOURNEYS</p>
              </CardContent>
            </Card>

            {/* Booking History */}
            <Card 
              className="group bg-gradient-to-br from-gray-900/90 to-black/90 border border-emerald-500/30 hover:border-emerald-400/50 hover:bg-gradient-to-br hover:from-gray-800/90 hover:to-gray-900/90 transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/10"
              onClick={() => router.push('/user/booking-history')}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-emerald-500/30 group-hover:bg-gradient-to-br group-hover:from-emerald-500/30 group-hover:to-green-600/30 transition-colors">
                    <History className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2 font-mono">TRIP_HISTORY</h3>
                <p className="text-gray-400 text-sm font-mono">VIEW_PAST_TRIPS</p>
              </CardContent>
            </Card>

            {/* Profile */}
            <Card 
              className="group bg-gradient-to-br from-gray-900/90 to-black/90 border border-amber-500/30 hover:border-amber-400/50 hover:bg-gradient-to-br hover:from-gray-800/90 hover:to-gray-900/90 transition-all duration-200 cursor-pointer shadow-lg shadow-amber-500/10"
              onClick={() => router.push('/user/profile')}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-amber-500/30 group-hover:bg-gradient-to-br group-hover:from-amber-500/30 group-hover:to-yellow-600/30 transition-colors">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2 font-mono">PROFILE</h3>
                <p className="text-gray-400 text-sm font-mono">MANAGE_ACCOUNT</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cyberpunk Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-orange-500/30 shadow-lg shadow-orange-500/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm font-medium font-mono">TOTAL_TRIPS</p>
                  <p className="text-xl sm:text-3xl font-bold text-white mt-1 font-mono">{loading ? '...' : stats.totalTrips}</p>
                  <p className="text-orange-400 text-xs mt-1 flex items-center font-mono">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    ALL_TIME
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-orange-500/30">
                  <Car className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm font-medium font-mono">COMPLETED</p>
                  <p className="text-xl sm:text-3xl font-bold text-white mt-1 font-mono">{loading ? '...' : stats.completedTrips}</p>
                  <p className="text-emerald-400 text-xs mt-1 flex items-center font-mono">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">SUCCESS_RATE: </span>{stats.totalTrips > 0 ? Math.round((stats.completedTrips / stats.totalTrips) * 100) : 0}%
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium">Total Spent</p>
                  <p className="text-xl sm:text-3xl font-bold text-white mt-1">{loading ? '...' : `${stats.totalSpent}`} <span className="text-sm sm:text-lg text-slate-400">DT</span></p>
                  <p className="text-slate-400 text-xs mt-1 flex items-center">
                    <Wallet className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Average: </span>{stats.completedTrips > 0 ? (stats.totalSpent / stats.completedTrips).toFixed(1) : '0'} DT
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-600/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Wallet className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium">Member Since</p>
                  <p className="text-lg sm:text-xl font-bold text-white mt-1">
                    {new Date(userProfile.createdAt || Date.now()).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-blue-400 text-xs mt-1 flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Member</span>
                    <span className="sm:hidden">✓</span>
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-600/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Award className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">Recent Activity</h3>
              <p className="text-slate-400 text-sm sm:text-base">Your latest transactions and bookings</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/user/booking-history')}
              className="text-blue-400 hover:text-blue-300 hover:bg-slate-800/50 self-start sm:self-auto"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-slate-400 border-t-blue-400"></div>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-base sm:text-lg mb-1 sm:mb-2">No recent activity</p>
                  <p className="text-slate-500 text-sm">Your transactions will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentTransactions.map((transaction, index) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-700/30 rounded-lg sm:rounded-xl border border-slate-700/50">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          transaction.status === 'completed' 
                            ? 'bg-emerald-600/20 text-emerald-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {transaction.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-sm sm:text-base truncate">{transaction.description}</p>
                          <div className="flex items-center space-x-2 sm:space-x-3 mt-1">
                            <p className="text-slate-400 text-xs sm:text-sm">{transaction.date}</p>
                            <span className="text-slate-600 hidden sm:inline">•</span>
                            <p className="text-slate-400 text-xs sm:text-sm font-mono truncate">{transaction.paymentRef}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className={`text-sm sm:text-lg font-semibold ${
                          transaction.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} DT
                        </p>
                        <p className="text-slate-400 text-xs sm:text-sm capitalize">{transaction.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}