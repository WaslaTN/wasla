'use client'

import React, { useState } from 'react'
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
  ArrowRight,
  CheckCircle,
  AlertCircle,
  QrCode,
  Sparkles,
  Navigation,
  Timer,
  Plane,
  Train,
  Copy,
  Share2
} from 'lucide-react'

interface ModernETicketProps {
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
      governorate: string
      delegation: string
    }
    destinationStation: {
      id: string
      name: string
      governorate: string
      delegation: string
    }
  }
  onViewDetails?: () => void
  compact?: boolean
}

export default function ModernETicket({ booking, onViewDetails, compact = false }: ModernETicketProps) {
  const [copied, setCopied] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'CANCELLED': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
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

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.verificationCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  const { date, time } = formatDate(booking.journeyDate)

  if (compact) {
    return (
      <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
        {/* Ticket perforation effect */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 rounded-full -ml-3 border-2 border-slate-700/50"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-950 rounded-full -mr-3 border-2 border-slate-700/50"></div>
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Train className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">
                    {booking.departureStation.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="text-white font-semibold">
                    {booking.destinationStation.name}
                  </span>
                </div>
                <div className="text-slate-400 text-sm">{date} • {time}</div>
              </div>
            </div>
            <Badge className={`${getStatusColor(booking.status)} px-3 py-1`}>
              {getStatusIcon(booking.status)}
              <span className="ml-2 text-xs font-medium">{booking.status}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{booking.seatsBooked}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{booking.totalAmount} DT</span>
              </div>
              <div className="flex items-center space-x-1">
                <QrCode className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300 font-mono text-xs">{booking.verificationCode}</span>
              </div>
            </div>
            
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails?.()
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
      {/* Premium gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Ticket perforation effect */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-950 rounded-full -ml-4 border-4 border-slate-700/50"></div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-950 rounded-full -mr-4 border-4 border-slate-700/50"></div>
      
      {/* Dotted line */}
      <div className="absolute left-6 right-6 top-1/2 border-t border-dashed border-slate-600/50 -translate-y-1/2"></div>

      <CardContent className="p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">LOUAJ</h3>
              <p className="text-slate-400 text-sm font-medium tracking-wide">DIGITAL BOARDING PASS</p>
            </div>
          </div>
          
          <Badge className={`${getStatusColor(booking.status)} px-4 py-2 text-sm`}>
            {getStatusIcon(booking.status)}
            <span className="ml-2 font-medium">{booking.status}</span>
          </Badge>
        </div>

        {/* Route Information */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{booking.departureStation.name}</div>
              <div className="text-slate-400 text-sm">{booking.departureStation.governorate}</div>
              <div className="text-slate-500 text-xs">{booking.departureStation.delegation}</div>
            </div>
            
            <div className="flex items-center space-x-3 px-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <Navigation className="w-5 h-5 text-slate-400" />
              <div className="w-16 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{booking.destinationStation.name}</div>
              <div className="text-slate-400 text-sm">{booking.destinationStation.governorate}</div>
              <div className="text-slate-500 text-xs">{booking.destinationStation.delegation}</div>
            </div>
          </div>
        </div>

        {/* Ticket Details Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Date</div>
            <div className="text-white font-semibold">{date}</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Time</div>
            <div className="text-white font-semibold">{time}</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Passengers</div>
            <div className="text-white font-semibold">{booking.seatsBooked}</div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-amber-400" />
            </div>
            <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total</div>
            <div className="text-white font-semibold">{booking.totalAmount} DT</div>
          </div>
        </div>

        {/* Verification Code */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Verification Code</div>
                <div className="text-2xl font-mono font-bold text-white tracking-wider">
                  {booking.verificationCode}
                </div>
                <div className="text-slate-500 text-xs mt-1">Show this to the driver</div>
              </div>
            </div>
            
            <Button
              onClick={copyCode}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-slate-500 text-sm">
            Booking ID: <span className="font-mono">{booking.id.slice(-8)}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            <Button
              onClick={onViewDetails}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}