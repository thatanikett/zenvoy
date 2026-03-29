import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const ABES_COORDINATES = [77.4458, 28.6342]
const HAS_MAPBOX_TOKEN = Boolean(import.meta.env.VITE_MAPBOX_TOKEN)

export default function LandingMapPreview() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!HAS_MAPBOX_TOKEN || !containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: ABES_COORDINATES,
      zoom: 14.9,
      pitch: 52,
      bearing: -18,
      interactive: true,
      attributionControl: false,
    })

    map.scrollZoom.enable()
    map.dragPan.enable()
    map.doubleClickZoom.enable()
    map.touchZoomRotate.enable()

    mapRef.current = map

    const marker = document.createElement('div')
    marker.className = 'landing-map-marker'
    new mapboxgl.Marker({ element: marker, anchor: 'bottom' })
      .setLngLat(ABES_COORDINATES)
      .addTo(map)

    new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 20,
      className: 'landing-map-popup',
    })
      .setLngLat(ABES_COORDINATES)
      .setHTML(`
        <div style="display:flex;flex-direction:column;gap:6px;min-width:180px;">
          <strong style="font-family:var(--font-body);font-size:14px;color:var(--text-primary);">ABES Engineering College</strong>
          <span style="font-family:var(--font-body);font-size:12px;line-height:1.5;color:var(--text-secondary);">
            Ghaziabad, Uttar Pradesh
          </span>
        </div>
      `)
      .addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  if (!HAS_MAPBOX_TOKEN) {
    return (
      <div className="landing-map-fallback">
        <span>Map preview unavailable</span>
        <strong>Add `VITE_MAPBOX_TOKEN` to show ABES Ghaziabad live on the landing page.</strong>
      </div>
    )
  }

  return (
    <div className="landing-map-frame">
      <div ref={containerRef} className="landing-map-canvas" />
    </div>
  )
}
