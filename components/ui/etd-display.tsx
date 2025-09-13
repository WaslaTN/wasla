"use client"

import { Clock, Brain, TrendingUp, AlertCircle, Car, Timer } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ETDPrediction {
  estimatedDepartureTime: string
  etdHours: number
  confidenceLevel: number
  modelUsed: string
  queueVehicles: number
}

interface ETDDisplayProps {
  etaPrediction: ETDPrediction | null
  className?: string
  showDetails?: boolean
  compact?: boolean
}

export default function ETDDisplay({
  etaPrediction,
  className = "",
  showDetails = true,
  compact = false,
}: ETDDisplayProps) {
  if (!etaPrediction) {
    return (
      <div className={`flex items-center gap-2 text-white/60 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">ETD not available</span>
      </div>
    )
  }

  const confidencePercent = Math.round(etaPrediction.confidenceLevel * 100)

  // Parse the departure time with error handling
  let departureTime: Date
  let timeString: string
  let minutesUntilDeparture: number

  try {
    departureTime = new Date(etaPrediction.estimatedDepartureTime)

    // Check if the date is valid
    if (isNaN(departureTime.getTime())) {
      // If invalid, try alternative parsing or use current time + hours
      const fallbackTime = new Date()
      fallbackTime.setHours(fallbackTime.getHours() + etaPrediction.etdHours)
      departureTime = fallbackTime
    }

    timeString = departureTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    // Calculate minutes until departure
    const now = new Date()
    minutesUntilDeparture = Math.round((departureTime.getTime() - now.getTime()) / (1000 * 60))
  } catch (error) {
    // Fallback to current time + ETD hours
    const fallbackTime = new Date()
    fallbackTime.setHours(fallbackTime.getHours() + etaPrediction.etdHours)
    timeString = fallbackTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    minutesUntilDeparture = Math.round(etaPrediction.etdHours * 60)
  }

  // Format time display
  const formatTimeDisplay = (minutes: number) => {
    if (minutes < 1) return "Departing now"
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours}h`
    return `${hours}h ${remainingMinutes}m`
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-400 bg-green-500/20 border-green-500/30"
    if (confidence >= 0.6) return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30"
    return "text-red-400 bg-red-500/20 border-red-500/30"
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High"
    if (confidence >= 0.6) return "Medium"
    return "Low"
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="w-4 h-4 text-cyan-400" />
        <span className="text-white font-medium">{formatTimeDisplay(minutesUntilDeparture)}</span>
        <Badge className={`px-2 py-0.5 text-xs border ${getConfidenceColor(etaPrediction.confidenceLevel)}`}>
          {confidencePercent}%
        </Badge>
      </div>
    )
  }

  return (
    <div className={`bg-slate-800/30 rounded-xl border border-slate-600/30 p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h4 className="text-white font-semibold text-lg">AI-Powered ETD</h4>
          <p className="text-white/60 text-sm">Smart departure prediction</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400">{formatTimeDisplay(minutesUntilDeparture)}</div>
          <div className="text-white/60 text-sm">Time Until Departure</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">{timeString}</div>
          <div className="text-white/60 text-sm">Est. Departure</div>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-white/80 text-sm">Confidence</span>
            </div>
            <Badge className={`px-2 py-1 border ${getConfidenceColor(etaPrediction.confidenceLevel)}`}>
              {getConfidenceText(etaPrediction.confidenceLevel)} ({confidencePercent}%)
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-400" />
              <span className="text-white/80 text-sm">Queue Vehicles</span>
            </div>
            <span className="text-white/60 text-sm">{etaPrediction.queueVehicles}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-purple-400" />
              <span className="text-white/80 text-sm">Model Used</span>
            </div>
            <span className="text-white/60 text-xs font-mono">{etaPrediction.modelUsed}</span>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/10">
        <p className="text-white/50 text-xs text-center">
          Prediction based on current queue data and historical patterns
        </p>
      </div>
    </div>
  )
}
