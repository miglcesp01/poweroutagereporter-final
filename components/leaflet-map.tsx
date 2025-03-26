"use client"

import { useEffect, useState } from "react"

export default function LeafletMap({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number } | null
  setPosition: (position: { lat: number; lng: number }) => void
}) {
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const defaultPosition = position || { lat: 40.7128, lng: -74.006 }

  useEffect(() => {
    const initializeMap = async () => {
      const L = await import("leaflet")
      await import("leaflet/dist/leaflet.css")

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      })

      if (!map) {
        const mapInstance = L.map("map").setView([defaultPosition.lat, defaultPosition.lng], 13)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance)

        mapInstance.on("click", (e: any) => {
          const { lat, lng } = e.latlng
          setPosition({ lat, lng })
        })

        setMap(mapInstance)
      }
    }

    initializeMap()

    return () => {
      if (map) {
        map.remove()
        setMap(null)
      }
    }
  }, [])

  useEffect(() => {
    const updateMarker = async () => {
      if (!map || !position) return

      if (marker) {
        marker.remove()
      }

      const L = await import("leaflet")

      const newMarker = L.marker([position.lat, position.lng]).addTo(map)
      setMarker(newMarker)

      map.setView([position.lat, position.lng], map.getZoom())
    }

    updateMarker()
  }, [map, position])

  return <div id="map" style={{ height: "100%", width: "100%" }}></div>
}

