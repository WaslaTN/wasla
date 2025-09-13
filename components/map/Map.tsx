'use client'

import React, { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapProps {
  latitude: number
  longitude: number
  zoom?: number
  className?: string
  showMarker?: boolean
  markerColor?: string
  draggable?: boolean
  clickable?: boolean
  onMarkerDrag?: (lat: number, lng: number) => void
  onMapClick?: (lat: number, lng: number) => void
}

export default function Map({ 
  latitude, 
  longitude, 
  zoom = 12, 
  className = "w-full h-96",
  showMarker = true,
  markerColor = '#3B82F6',
  draggable = false,
  clickable = false,
  onMarkerDrag,
  onMapClick
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // Set mapbox access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: zoom
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add click event listener if map is clickable
    if (clickable && onMapClick) {
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat
        onMapClick(lat, lng)
      })
    }

    // Add marker if needed
    if (showMarker) {
      marker.current = new mapboxgl.Marker({ 
        color: markerColor,
        draggable: draggable 
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current)

      // Add drag event listener if marker is draggable
      if (draggable && onMarkerDrag) {
        marker.current.on('dragend', () => {
          const lngLat = marker.current?.getLngLat()
          if (lngLat) {
            onMarkerDrag(lngLat.lat, lngLat.lng)
          }
        })
      }
    }

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (map.current) {
      map.current.setCenter([longitude, latitude])
      
      if (marker.current) {
        marker.current.setLngLat([longitude, latitude])
      } else if (showMarker) {
        marker.current = new mapboxgl.Marker({ 
          color: markerColor,
          draggable: draggable 
        })
          .setLngLat([longitude, latitude])
          .addTo(map.current)

        // Add drag event listener if marker is draggable
        if (draggable && onMarkerDrag) {
          marker.current.on('dragend', () => {
            const lngLat = marker.current?.getLngLat()
            if (lngLat) {
              onMarkerDrag(lngLat.lat, lngLat.lng)
            }
          })
        }
      }
    }
  }, [latitude, longitude, showMarker, markerColor, draggable, clickable, onMarkerDrag, onMapClick])

  return (
    <div 
      ref={mapContainer} 
      className={`rounded-lg border ${className} ${clickable ? 'cursor-crosshair' : ''}`}
    />
  )
}
