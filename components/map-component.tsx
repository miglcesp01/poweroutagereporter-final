"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface MapComponentProps {
  position: { lat: number; lng: number } | null
  setPosition: (position: { lat: number; lng: number }) => void
  setAddress: (address: string) => void
}

export default function MapComponent({ position, setPosition, setAddress }: MapComponentProps) {
  const [mapCenter] = useState<[number, number]>(position ? [position.lat, position.lng] : [40.7128, -74.006])
  const [isMapLoading, setIsMapLoading] = useState(true)

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosition({ lat, lng })

        fetchAddress(lat, lng)
      },
      load() {
        setIsMapLoading(false)
      },
      tileloadend() {
        setIsMapLoading(false)
      },
    })
    return null
  }

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "PowerOutageReporter/1.0 (your-email@example.com)",
          },
        },
      )
      const data = await response.json()
      if (data && data.display_name) {
        setAddress(data.display_name)
      } else {
        setAddress("Address not found")
      }
    } catch (error) {
      console.error("Error fetching address:", error)
      setAddress("Error fetching address")
    }
  }

  useEffect(() => {
    if (position) {
      fetchAddress(position.lat, position.lng)
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      {isMapLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium">Loading map...</p>
          </div>
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        className="rounded-md"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{
            load: () => setIsMapLoading(false),
          }}
        />
        {position && <Marker position={[position.lat, position.lng]} />}
        <MapClickHandler />
      </MapContainer>
    </div>
  )
}

