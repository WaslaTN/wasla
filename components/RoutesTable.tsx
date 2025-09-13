"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/hooks/useLanguage"
import { ArrowRight, Loader2, AlertCircle } from "lucide-react"

interface Station {
  id: string
  name: string
  nameAr: string
  latitude: number
  longitude: number
  isOnline: boolean
  governorate: {
    name: string
    nameAr: string
  }
}

interface Route {
  id: string
  basePrice: string
  isActive: boolean
  departureStation: Station
  destinationStation: Station
}

interface RoutesResponse {
  success: boolean
  data: {
    routes: Route[]
  }
}

export function RoutesTable() {
  const { t, language } = useLanguage()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter unique routes (A→B and B→A are considered the same route)
  const filterUniqueRoutes = (routes: Route[]) => {
    const routeMap = new Map<string, Route>()

    routes.forEach((route) => {
      // Create a standardized key where stations are ordered alphabetically
      const stations = [route.departureStation.id, route.destinationStation.id].sort()
      const key = `${stations[0]}-${stations[1]}`

      // Only add if we haven't seen this route pair before
      if (!routeMap.has(key)) {
        routeMap.set(key, route)
      }
    })

    return Array.from(routeMap.values())
  }

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("http://localhost:5000/api/v1/routes")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: RoutesResponse = await response.json()

        if (data.success && data.data?.routes) {
          const uniqueRoutes = filterUniqueRoutes(data.data.routes)
          setRoutes(uniqueRoutes)
        } else {
          throw new Error("Invalid response format")
        }
      } catch (err) {
        console.error("Error fetching routes:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
        // Fallback to empty array for demo
        setRoutes([])
      } finally {
        setLoading(false)
      }
    }

    fetchRoutes()
  }, [])

  const getStationName = (station: Station) => {
    return language.code === "fr" ? station.nameAr || station.name : station.name
  }

  const getGovernorateName = (governorate: { name: string; nameAr: string }) => {
    return language.code === "fr" ? governorate.nameAr || governorate.name : governorate.name
  }

  if (loading) {
    return (
      <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-red-400 mr-3" />
          <span className="text-white">{t("loadingRoutes")}</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
          <span className="text-white mb-4">{t("errorLoadingRoutes")}</span>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            {t("tryAgain")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white text-2xl font-bold">{t("routesTitle")}</CardTitle>
        <CardDescription className="text-gray-300">{t("routesSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {routes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No routes available at the moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="font-semibold text-red-400">{t("departureStation")}</div>
                <div className="font-semibold text-red-400">{t("destinationStation")}</div>
                <div className="font-semibold text-red-400">{t("price")}</div>
              </div>

              {/* Routes */}
              <div className="space-y-3">
                {routes.map((route) => (
                  <div
                    key={route.id}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-black/20 rounded-lg border border-red-500/10 hover:border-red-500/30 transition-colors"
                  >
                    {/* Departure Station */}
                    <div className="flex flex-col">
                      <div className="text-white font-medium">{getStationName(route.departureStation)}</div>
                      <div className="text-gray-400 text-sm">
                        {getGovernorateName(route.departureStation.governorate)}
                      </div>
                      <Badge
                        variant={route.departureStation.isOnline ? "default" : "secondary"}
                        className={`mt-1 w-fit text-xs ${
                          route.departureStation.isOnline
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {route.departureStation.isOnline ? t("stationOnline") : t("stationOffline")}
                      </Badge>
                    </div>

                    {/* Destination Station */}
                    <div className="flex flex-col relative">
                      <div className="hidden md:flex items-center justify-center mb-2">
                        <ArrowRight className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="text-white font-medium">{getStationName(route.destinationStation)}</div>
                      <div className="text-gray-400 text-sm">
                        {getGovernorateName(route.destinationStation.governorate)}
                      </div>
                      <Badge
                        variant={route.destinationStation.isOnline ? "default" : "secondary"}
                        className={`mt-1 w-fit text-xs ${
                          route.destinationStation.isOnline
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {route.destinationStation.isOnline ? t("stationOnline") : t("stationOffline")}
                      </Badge>
                    </div>

                    {/* Price */}
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-red-400">
                        {route.basePrice} {t("currency")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
