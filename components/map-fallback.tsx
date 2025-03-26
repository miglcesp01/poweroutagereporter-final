"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface MapFallbackProps {
  position: { lat: number; lng: number } | null
  setPosition: (position: { lat: number; lng: number }) => void
  error?: string
}

export default function MapFallback({ position, setPosition, error }: MapFallbackProps) {
  const defaultPosition = position || { lat: 40.7128, lng: -74.006 }
  const [lat, setLat] = useState(defaultPosition.lat.toString())
  const [lng, setLng] = useState(defaultPosition.lng.toString())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPosition({
      lat: Number.parseFloat(lat),
      lng: Number.parseFloat(lng),
    })
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 rounded-md p-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Map Unavailable</h3>
        <p className="text-sm text-gray-500 mt-1">
          {error || "The map couldn't be loaded. Please enter your coordinates manually."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Set Location
        </Button>
      </form>
    </div>
  )
}

