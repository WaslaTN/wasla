'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Ticket,
  Clock,
  MapPin,
  Users,
  Calendar,
  CreditCard,
  Train,
  ArrowRight,
  Timer,
  CheckCircle,
  AlertCircle,
  QrCode,
  RotateCcw,
  Star,
  Phone,
  Mail,
  Globe
} from 'lucide-react'
import { useLanguage } from '@/lib/hooks/useLanguage'

interface ETDPrediction {
  estimatedDepartureTime: string
  etdHours: number
  confidenceLevel: number
  modelUsed: string
  queueVehicles: number
}

interface FlipTicketProps {
  booking: {
    id: string
    verificationCode: string
    journeyDate: string
    totalAmount: number
    seatsBooked: number
    status: 'PENDING' | 'PAID' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
    departureStation: {
      id: string
      name: string
      nameAr?: string
      governorate: string
      delegation: string
    }
    destinationStation: {
      id: string
      name: string
      nameAr?: string
      governorate: string
      delegation: string
    }
    vehicles?: Array<{
      id: string
      licensePlate: string
      capacity: number
      availableSeats: number
      queuePosition: number
      status: string
      pricePerSeat: number
      estimatedDeparture?: string
      driverName?: string
      vehicleModel?: string
    }>
    etaPrediction?: ETDPrediction
  }
  onViewDetails?: () => void
}

export default function FlipTicket({ booking, onViewDetails }: FlipTicketProps) {
  const { t } = useLanguage()
  const [isFlipped, setIsFlipped] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')

  // Calculate time until departure if ETD is available
  useEffect(() => {
    if (!booking.etaPrediction) return

    const calculateTimeLeft = () => {
      try {
        const departureTime = new Date(booking.etaPrediction!.estimatedDepartureTime)
        const now = new Date()
        const diff = departureTime.getTime() - now.getTime()

        if (diff <= 0) {
          setTimeLeft('DEPARTED')
          return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (hours > 24) {
          const days = Math.floor(hours / 24)
          const remainingHours = hours % 24
          setTimeLeft(`${days}d ${remainingHours}h ${minutes}m`)
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`)
        } else {
          setTimeLeft(`${minutes}m`)
        }
      } catch (error) {
        setTimeLeft('N/A')
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [booking.etaPrediction])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'CANCELLED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'FAILED': return <AlertCircle className="w-4 h-4" />
      case 'CANCELLED': return <AlertCircle className="w-4 h-4" />
      default: return <Ticket className="w-4 h-4" />
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="relative w-full h-[600px]" style={{ perspective: '1000px' }}>
      {/* Ticket Container with 3D Transform */}
      <div
        className={`relative w-full h-full transition-transform duration-700 cursor-pointer`}
        onClick={handleFlip}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >

        {/* Front Face */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
          }}
        >
          <Card className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-blue-500/30 shadow-2xl overflow-hidden relative group hover:border-blue-400/50 transition-all duration-300">

            {/* Ticket Corners - Cut Effect */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-blue-400/50 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-blue-400/50 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-blue-400/50 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-blue-400/50 rounded-br-lg"></div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <CardContent className="p-6 h-full flex flex-col relative z-10">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                    <Train className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">LOUAJ</h2>
                    <p className="text-blue-400 text-sm font-medium">DIGITAL TICKET</p>
                  </div>
                </div>
                <Badge className={`px-3 py-1 ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  <span className="ml-2 text-xs font-semibold">{booking.status}</span>
                </Badge>
              </div>

              {/* Main Journey Info */}
              <div className="flex-1 space-y-6">
                {/* Route */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="flex flex-col items-end">
                      <span className="text-white font-bold text-lg">{booking.departureStation.name}</span>
                      <span className="text-gray-400 text-sm">{booking.departureStation.governorate}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                      <ArrowRight className="w-4 h-4 text-blue-400 mx-2" />
                      <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-white font-bold text-lg">{booking.destinationStation.name}</span>
                      <span className="text-gray-400 text-sm">{booking.destinationStation.governorate}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                    <div className="text-white font-semibold text-sm">
                      {new Date(booking.journeyDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <Users className="w-4 h-4" />
                      Seats
                    </div>
                    <div className="text-white font-semibold text-sm">{booking.seatsBooked}</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <CreditCard className="w-4 h-4" />
                      Amount
                    </div>
                    <div className="text-white font-semibold text-sm">{booking.totalAmount} DT</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <QrCode className="w-4 h-4" />
                      Code
                    </div>
                    <div className="text-white font-semibold font-mono text-sm">{booking.verificationCode}</div>
                  </div>
                </div>

                {/* ETD Info */}
                {booking.etaPrediction && timeLeft && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-semibold text-sm">ETD</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        timeLeft === 'DEPARTED'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {timeLeft === 'DEPARTED' ? '🚍 Departed' : `⏰ ${timeLeft}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                <span className="text-xs text-slate-400">Tap to flip</span>
                <RotateCcw className="w-4 h-4 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <Card className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-2 border-purple-500/30 shadow-2xl overflow-hidden relative group hover:border-purple-400/50 transition-all duration-300">

            {/* Ticket Corners - Cut Effect */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-purple-400/50 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-purple-400/50 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-purple-400/50 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-purple-400/50 rounded-br-lg"></div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Crect x='0' y='0' width='30' height='30' rx='4'/%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <CardContent className="p-6 h-full flex flex-col relative z-10">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">LOUAJ</h2>
                    <p className="text-purple-400 text-sm font-medium">TICKET DETAILS</p>
                  </div>
                </div>
                <Badge className="px-3 py-1 bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <span className="text-xs font-semibold">BACK</span>
                </Badge>
              </div>

              {/* Details Content */}
              <div className="flex-1 space-y-4">
                {/* Vehicle Information */}
                {booking.vehicles && booking.vehicles.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Train className="w-5 h-5 text-slate-400" />
                      Vehicle Details
                    </h4>
                    <div className="space-y-2">
                      {booking.vehicles.map((vehicle, index) => (
                        <div key={vehicle.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300 font-mono">{vehicle.licensePlate}</span>
                            <Badge variant="outline" className="text-xs border-purple-400/30 text-purple-300">
                              #{vehicle.queuePosition}
                            </Badge>
                          </div>
                          <span className="text-white">{vehicle.driverName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-slate-400" />
                    Support & Help
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">+216 12 345 678</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">support@louaj.tn</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">www.louaj.tn</span>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-white font-semibold mb-3 text-sm">Terms & Conditions</h4>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>• Valid only for the specified journey date</p>
                    <p>• Present ticket at departure station</p>
                    <p>• No refunds for cancelled bookings</p>
                    <p>• Arrive 30 minutes before departure</p>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-purple-400 mx-auto mb-2" />
                    <p className="text-white font-semibold text-sm mb-1">Scan to Verify</p>
                    <p className="text-gray-400 text-xs">Show this at the station</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails?.()
                  }}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Tap to flip</span>
                  <RotateCcw className="w-4 h-4 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
