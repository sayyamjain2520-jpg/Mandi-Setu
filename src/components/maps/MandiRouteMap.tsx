import React, { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MandiRouteMapProps {
  centreName: string
  destinationLat: number
  destinationLon: number
  className?: string
}

type RouteState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'routing' }
  | { status: 'ready'; distanceKm: number; durationMinutes: number }
  | { status: 'error'; message: string }

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`
  const hours = Math.floor(minutes / 60)
  const remaining = Math.round(minutes % 60)
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`
}

export const MandiRouteMap: React.FC<MandiRouteMapProps> = ({
  centreName,
  destinationLat,
  destinationLon,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.GeoJSON | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const [routeState, setRouteState] = useState<RouteState>({ status: 'idle' })

  useEffect(() => {
    if (!mapRef.current) return

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    })

    leafletMapRef.current = map

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    markersLayerRef.current = L.layerGroup().addTo(map)

    map.setView([destinationLat, destinationLon], 13)

    return () => {
      routeLayerRef.current?.remove()
      markersLayerRef.current?.clearLayers()
      map.remove()
      leafletMapRef.current = null
      routeLayerRef.current = null
      markersLayerRef.current = null
    }
  }, [destinationLat, destinationLon])

  useEffect(() => {
    const map = leafletMapRef.current
    const markers = markersLayerRef.current

    if (!map || !markers) return

    if (!Number.isFinite(destinationLat) || !Number.isFinite(destinationLon)) {
      setRouteState({ status: 'error', message: 'Mandi location is not configured yet.' })
      return
    }

    setRouteState({ status: 'locating' })

    if (!navigator.geolocation) {
      setRouteState({
        status: 'error',
        message: 'This browser does not support location access.',
      })
      return
    }

    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (cancelled) return

        const originLat = position.coords.latitude
        const originLon = position.coords.longitude

        markers.clearLayers()
        routeLayerRef.current?.remove()
        routeLayerRef.current = null

        L.circleMarker([originLat, originLon], {
          radius: 8,
          color: '#2563eb',
          weight: 3,
          fillColor: '#60a5fa',
          fillOpacity: 1,
        })
          .bindPopup('Your current location')
          .addTo(markers)

        L.circleMarker([destinationLat, destinationLon], {
          radius: 8,
          color: '#047857',
          weight: 3,
          fillColor: '#34d399',
          fillOpacity: 1,
        })
          .bindPopup(centreName)
          .addTo(markers)

        map.fitBounds(
          L.latLngBounds([
            [originLat, originLon],
            [destinationLat, destinationLon],
          ]),
          { padding: [30, 30] }
        )

        setRouteState({ status: 'routing' })

        try {
          const url = `${OSRM_URL}/${originLon},${originLat};${destinationLon},${destinationLat}?overview=full&geometries=geojson&steps=false`
          const response = await fetch(url)

          if (!response.ok) {
            throw new Error(`Routing service returned ${response.status}`)
          }

          const data = await response.json()

          if (cancelled) return

          if (data.code !== 'Ok' || !data.routes?.[0]) {
            throw new Error('No drivable route was found.')
          }

          const route = data.routes[0]

          routeLayerRef.current = L.geoJSON(route.geometry, {
            style: {
              color: '#059669',
              weight: 5,
              opacity: 0.9,
            },
          }).addTo(map)

          map.fitBounds(routeLayerRef.current.getBounds(), {
            padding: [30, 30],
          })

          setRouteState({
            status: 'ready',
            distanceKm: Number(route.distance || 0) / 1000,
            durationMinutes: Number(route.duration || 0) / 60,
          })
        } catch (error) {
          if (cancelled) return
          console.error('OSRM route error:', error)
          setRouteState({
            status: 'error',
            message: 'Could not calculate the route right now. Please try again.',
          })
        }
      },
      (error) => {
        if (cancelled) return

        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Allow location access to calculate your real route.'
            : error.code === error.TIMEOUT
              ? 'Location request timed out. Please try again.'
              : 'Could not get your current location.'

        setRouteState({ status: 'error', message })
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    )

    return () => {
      cancelled = true
    }
  }, [centreName, destinationLat, destinationLon])

  const openRoute = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition((position) => {
      const origin = `${position.coords.latitude},${position.coords.longitude}`
      const destination = `${destinationLat},${destinationLon}`
      window.open(
        `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin};${destination}`,
        '_blank',
        'noopener,noreferrer'
      )
    })
  }

  return (
    <div className={`rounded-2xl border border-emerald-200 bg-white overflow-hidden ${className}`}>
      <div className="p-3 border-b border-emerald-100 bg-emerald-50/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-black text-emerald-700">
              Live Route
            </p>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              Your location → {centreName}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Real GPS location + OpenStreetMap road routing
            </p>
          </div>

          {routeState.status === 'ready' && (
            <div className="shrink-0 text-right">
              <p className="text-sm font-black text-slate-900">
                {routeState.distanceKm.toFixed(1)} km
              </p>
              <p className="text-[10px] font-bold text-emerald-700">
                {formatDuration(routeState.durationMinutes)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div ref={mapRef} className="h-64 w-full" />

      <div className="p-3 bg-white border-t border-slate-100">
        {routeState.status === 'locating' && (
          <p className="text-xs text-slate-500">
            📍 Getting your current location… Please allow browser location access.
          </p>
        )}

        {routeState.status === 'routing' && (
          <p className="text-xs text-slate-500">
            🛣️ Calculating the real road route to {centreName}…
          </p>
        )}

        {routeState.status === 'error' && (
          <p className="text-xs text-rose-700 leading-relaxed">
            {routeState.message}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-[9px] text-slate-400">
            Map data © OpenStreetMap contributors
          </span>

          <button
            type="button"
            onClick={openRoute}
            className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-800 hover:bg-emerald-100"
          >
            Open Route ↗
          </button>
        </div>
      </div>
    </div>
  )
}

export default MandiRouteMap
