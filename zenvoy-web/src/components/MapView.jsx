import { useEffect, useEffectEvent, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { ensureMapillarySprites } from '../utils/mapillarySprites'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_TOKEN

// Delhi NCR centre
const DELHI_CENTER = [77.2090, 28.6139]
const DELHI_ZOOM   = 12
const DELHI_BOUNDS = [
  [76.84, 28.40],
  [77.35, 28.88],
]
const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/navigation-night-v1',
  light: 'mapbox://styles/mapbox/streets-v12',
}

export default function MapView({
  mapTheme,
  safeRoute,
  fastRoute,
  origin,
  destination,
  showMapillaryTrafficSigns,
  showMapillaryPoints,
  mapillaryTrafficSignValues,
  mapillaryPointValues,
  onMapClick,
}) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef([])
  const popupRef     = useRef(null)
  const styleRef     = useRef(MAP_STYLES[mapTheme] || MAP_STYLES.dark)
  const emitMapClick = useEffectEvent((event) => {
    const map = mapRef.current
    if (!map) return

    const mapillaryFeature = getMapillaryFeatureAtPoint(map, event.point)

    if (mapillaryFeature) {
      showMapillaryPopup(map, event.lngLat, mapillaryFeature, popupRef)
      return
    }

    popupRef.current?.remove()
    onMapClick?.({
      lat: event.lngLat.lat,
      lng: event.lngLat.lng,
    })
  })

  const ensureRouteLayers = useEffectEvent(() => {
    const map = mapRef.current
    if (!map) return

    if (!map.getSource('fast-route')) {
      map.addSource('fast-route', { type: 'geojson', data: emptyGeoJSON() })
    }

    if (!map.getLayer('fast-route-outline')) {
      map.addLayer({
        id: 'fast-route-outline',
        type: 'line',
        source: 'fast-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {},
      })
    }

    if (!map.getLayer('fast-route-line')) {
      map.addLayer({
        id: 'fast-route-line',
        type: 'line',
        source: 'fast-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {},
      })
    }

    if (!map.getSource('safe-route')) {
      map.addSource('safe-route', { type: 'geojson', data: emptyGeoJSON() })
    }

    if (!map.getLayer('safe-route-glow')) {
      map.addLayer({
        id: 'safe-route-glow',
        type: 'line',
        source: 'safe-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#86d89a',
          'line-width': 10,
          'line-opacity': 0.22,
          'line-blur': 4,
          'line-offset': -2,
        },
      })
    }

    if (!map.getLayer('safe-route-outline')) {
      map.addLayer({
        id: 'safe-route-outline',
        type: 'line',
        source: 'safe-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {},
      })
    }

    if (!map.getLayer('safe-route-line')) {
      map.addLayer({
        id: 'safe-route-line',
        type: 'line',
        source: 'safe-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {},
      })
    }

    map.setPaintProperty('fast-route-outline', 'line-color', 'rgba(255,255,255,0.55)')
    map.setPaintProperty('fast-route-outline', 'line-width', 8)
    map.setPaintProperty('fast-route-outline', 'line-opacity', 0.55)
    map.setPaintProperty('fast-route-outline', 'line-offset', 3)

    map.setPaintProperty('fast-route-line', 'line-color', '#ff5a67')
    map.setPaintProperty('fast-route-line', 'line-width', 5)
    map.setPaintProperty('fast-route-line', 'line-opacity', 0.98)
    map.setPaintProperty('fast-route-line', 'line-dasharray', [2.2, 1.6])
    map.setPaintProperty('fast-route-line', 'line-offset', 3)

    map.setPaintProperty('safe-route-glow', 'line-color', '#79f2a0')
    map.setPaintProperty('safe-route-glow', 'line-width', 12)
    map.setPaintProperty('safe-route-glow', 'line-opacity', 0.3)
    map.setPaintProperty('safe-route-glow', 'line-blur', 5)
    map.setPaintProperty('safe-route-glow', 'line-offset', -3)

    map.setPaintProperty('safe-route-outline', 'line-color', 'rgba(255,255,255,0.5)')
    map.setPaintProperty('safe-route-outline', 'line-width', 9)
    map.setPaintProperty('safe-route-outline', 'line-opacity', 0.48)
    map.setPaintProperty('safe-route-outline', 'line-offset', -3)

    map.setPaintProperty('safe-route-line', 'line-color', '#4dde7e')
    map.setPaintProperty('safe-route-line', 'line-width', 5.8)
    map.setPaintProperty('safe-route-line', 'line-opacity', 0.99)
    map.setPaintProperty('safe-route-line', 'line-offset', -3)
  })

  const ensureMapillaryFeatureLayers = useEffectEvent(() => {
    const map = mapRef.current
    if (!map || !MAPILLARY_TOKEN) return

    void setupMapillaryFeatureLayers(map, {
      showMapillaryTrafficSigns,
      showMapillaryPoints,
      mapillaryTrafficSignValues,
      mapillaryPointValues,
    })
  })

  const syncMapillaryFeatureVisibility = useEffectEvent(() => {
    const map = mapRef.current
    if (!map || !MAPILLARY_TOKEN) return

    ensureMapillaryFeatureLayers()

    if (map.getLayer('mapillary-traffic-signs-layer')) {
      map.setLayoutProperty(
        'mapillary-traffic-signs-layer',
        'visibility',
        showMapillaryTrafficSigns ? 'visible' : 'none'
      )
    }

    if (map.getLayer('mapillary-points-layer')) {
      map.setLayoutProperty(
        'mapillary-points-layer',
        'visibility',
        showMapillaryPoints ? 'visible' : 'none'
      )
    }
  })

  const syncMarkers = useEffectEvent(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (origin) {
      const marker = new mapboxgl.Marker({
        color: '#4285F4',
        scale: 1.3,
        anchor: 'bottom',
      })
        .setLngLat([origin.lng, origin.lat])
        .addTo(map)
      markersRef.current.push(marker)
    }

    if (destination) {
      const marker = new mapboxgl.Marker({
        color: '#EA4335',
        scale: 1.3,
        anchor: 'bottom',
      })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map)
      markersRef.current.push(marker)
    }
  })

  const syncRouteSources = useEffectEvent(() => {
    const map = mapRef.current
    if (!map) return

    ensureRouteLayers()

    const safeSource = map.getSource('safe-route')
    const fastSource = map.getSource('fast-route')
    if (!safeSource || !fastSource) return

    safeSource.setData(
      safeRoute?.coordinates ? coordsToGeoJSON(safeRoute.coordinates) : emptyGeoJSON()
    )
    fastSource.setData(
      fastRoute?.coordinates ? coordsToGeoJSON(fastRoute.coordinates) : emptyGeoJSON()
    )

    if (!safeRoute?.coordinates?.length) return

    const allCoords = [
      ...safeRoute.coordinates,
      ...(fastRoute?.coordinates || []),
      ...(origin ? [[origin.lat, origin.lng]] : []),
      ...(destination ? [[destination.lat, destination.lng]] : []),
    ]
    const bounds = allCoords.reduce(
      (b, [lat, lng]) => b.extend([lng, lat]),
      new mapboxgl.LngLatBounds(
        [allCoords[0][1], allCoords[0][0]],
        [allCoords[0][1], allCoords[0][0]]
      )
    )
    map.fitBounds(bounds, {
      padding: { top: 110, bottom: 120, left: 420, right: 460 },
      duration: 1200,
    })
  })

  // Init map once
  useEffect(() => {
    if (mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleRef.current,
      center: DELHI_CENTER,
      zoom: DELHI_ZOOM,
      maxBounds: DELHI_BOUNDS,
      attributionControl: false,
    })

    map.on('style.load', () => {
      ensureRouteLayers()
      ensureMapillaryFeatureLayers()
      syncMapillaryFeatureVisibility()
      syncRouteSources()
      syncMarkers()
    })
    map.on('click', emitMapClick)
    map.on('mousemove', (event) => {
      const feature = getMapillaryFeatureAtPoint(map, event.point)
      map.getCanvas().style.cursor = feature ? 'pointer' : ''
    })

    mapRef.current = map
    const popup = popupRef.current
    return () => {
      popup?.remove()
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const nextStyle = MAP_STYLES[mapTheme] || MAP_STYLES.dark
    if (styleRef.current === nextStyle) return

    styleRef.current = nextStyle
    map.setStyle(nextStyle)
  }, [mapTheme])

  // Update routes when data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (map.isStyleLoaded()) {
      syncRouteSources()
      return
    }

    map.once('style.load', syncRouteSources)
  }, [destination, fastRoute, origin, safeRoute])

  // Update origin/destination markers
  useEffect(() => {
    syncMarkers()
  }, [origin, destination])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (map.isStyleLoaded()) {
      syncMapillaryFeatureVisibility()
      return
    }

    map.once('style.load', syncMapillaryFeatureVisibility)
  }, [
    mapillaryPointValues,
    mapillaryTrafficSignValues,
    showMapillaryPoints,
    showMapillaryTrafficSigns,
  ])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}

// ── Helpers ────────────────────────────────────────────
function emptyGeoJSON() {
  return { type: 'FeatureCollection', features: [] }
}

// coords are [lat, lng] from backend — mapbox needs [lng, lat]
function coordsToGeoJSON(coords) {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords.map(([lat, lng]) => [lng, lat]),
      },
    }],
  }
}

function getMapillaryFeatureAtPoint(map, point) {
  const layers = [
    'mapillary-traffic-signs-layer',
    'mapillary-points-layer',
  ].filter((layerId) => map.getLayer(layerId))

  if (!layers.length) return null

  const [feature] = map.queryRenderedFeatures(point, { layers })
  return feature || null
}

function showMapillaryPopup(map, lngLat, feature, popupRef) {
  const props = feature.properties || {}
  const kind = feature.layer?.['source-layer'] === 'traffic_sign'
    ? 'Traffic sign'
    : 'Map object'

  const value = props.value || 'Unclassified object'
  const popupHtml = `
    <div style="display:flex;flex-direction:column;gap:8px;min-width:220px;">
      <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;color:#d9ef92;">
        ${kind.toUpperCase()}
      </div>
      <div style="font-family:var(--font-body);font-size:14px;color:#f2f6f9;line-height:1.45;">
        ${escapeHtml(humanizeValue(value))}
      </div>
      <div style="font-family:var(--font-body);font-size:12px;color:#a4b0bc;line-height:1.5;">
        First seen: ${formatTimestamp(props.first_seen_at)}<br/>
        Last seen: ${formatTimestamp(props.last_seen_at)}
      </div>
    </div>
  `

  popupRef.current?.remove()
  popupRef.current = new mapboxgl.Popup({
    closeButton: false,
    maxWidth: '280px',
    offset: 14,
  })
    .setLngLat(lngLat)
    .setHTML(popupHtml)
    .addTo(map)
}

function humanizeValue(value) {
  return value
    .split('--')
    .filter(Boolean)
    .join(' ')
    .replace(/_/g, ' ')
}

function formatTimestamp(value) {
  if (!value) return 'Unknown'

  const date = new Date(Number(value))
  if (Number.isNaN(date.getTime())) return 'Unknown'

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

async function setupMapillaryFeatureLayers(map, visibility) {
  await ensureMapillarySprites(map)

  if (!map.getSource('mapillary-traffic-signs')) {
    map.addSource('mapillary-traffic-signs', {
      type: 'vector',
      tiles: [
        `https://tiles.mapillary.com/maps/vtp/mly_map_feature_traffic_sign/2/{z}/{x}/{y}?access_token=${MAPILLARY_TOKEN}`,
      ],
      minzoom: 14,
      maxzoom: 14,
    })
  }

  if (!map.getSource('mapillary-points')) {
    map.addSource('mapillary-points', {
      type: 'vector',
      tiles: [
        `https://tiles.mapillary.com/maps/vtp/mly_map_feature_point/2/{z}/{x}/{y}?access_token=${MAPILLARY_TOKEN}`,
      ],
      minzoom: 14,
      maxzoom: 14,
    })
  }

  if (!map.getLayer('mapillary-traffic-signs-layer')) {
    map.addLayer({
      id: 'mapillary-traffic-signs-layer',
      type: 'symbol',
      source: 'mapillary-traffic-signs',
      'source-layer': 'traffic_sign',
      minzoom: 14,
      layout: {
        'icon-image': [
          'coalesce',
          ['image', ['concat', 'mapillary-sign-', ['get', 'value']]],
          ['image', 'mapillary-sign-fallback'],
        ],
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14, 0.18,
          18, 0.36,
        ],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'visibility': visibility.showMapillaryTrafficSigns ? 'visible' : 'none',
      },
    })
  }

  if (!map.getLayer('mapillary-points-layer')) {
    map.addLayer({
      id: 'mapillary-points-layer',
      type: 'symbol',
      source: 'mapillary-points',
      'source-layer': 'point',
      minzoom: 14,
      layout: {
        'icon-image': [
          'coalesce',
          ['image', ['concat', 'mapillary-object-', ['get', 'value']]],
          ['image', 'mapillary-object-fallback'],
        ],
        'icon-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14, 0.22,
          18, 0.46,
        ],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'visibility': visibility.showMapillaryPoints ? 'visible' : 'none',
      },
    })
  }

  if (map.getLayer('mapillary-traffic-signs-layer')) {
    map.setLayoutProperty(
      'mapillary-traffic-signs-layer',
      'visibility',
      visibility.showMapillaryTrafficSigns ? 'visible' : 'none'
    )
    map.setFilter(
      'mapillary-traffic-signs-layer',
      createValueFilter(visibility.mapillaryTrafficSignValues)
    )
  }

  if (map.getLayer('mapillary-points-layer')) {
    map.setLayoutProperty(
      'mapillary-points-layer',
      'visibility',
      visibility.showMapillaryPoints ? 'visible' : 'none'
    )
    map.setFilter(
      'mapillary-points-layer',
      createValueFilter(visibility.mapillaryPointValues)
    )
  }
}

function createValueFilter(values) {
  if (values == null) return null
  if (!values.length) return ['==', ['get', 'value'], '__no_match__']
  return ['in', ['get', 'value'], ['literal', values]]
}
