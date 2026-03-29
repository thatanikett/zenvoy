import { useState, useCallback, useEffect, useRef } from 'react'
import MapView from './MapView'
import SearchBar from './SearchBar'
import SafetyPanel from './Safetypanel'
import SOSButton from './SOSbutton'
import { getSafeRoute, getFastRoute } from '../api'
import StreetViewPanel from './StreetViewPanel'
import { getNearestMapillaryImage } from '../services/mapillaryService'
import MapDataPanel from './MapDataPanel'

const HAS_MAPBOX_TOKEN = Boolean(import.meta.env.VITE_MAPBOX_TOKEN)
const HAS_MAPILLARY_TOKEN = Boolean(import.meta.env.VITE_MAPILLARY_TOKEN)
const DEFAULT_SIGN_SELECTION = ['all']
const DEFAULT_OBJECT_SELECTION = []

export default function MapExperience() {
  const [mapTheme, setMapTheme]      = useState('dark')
  const [origin, setOrigin]           = useState(null)
  const [destination, setDestination] = useState(null)
  const [safeRoute, setSafeRoute]     = useState(null)
  const [fastRoute, setFastRoute]     = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [panelOpen, setPanelOpen]     = useState(false)
  const [streetViewOpen, setStreetViewOpen] = useState(false)
  const [streetViewLoading, setStreetViewLoading] = useState(false)
  const [streetViewError, setStreetViewError] = useState(null)
  const [streetViewImage, setStreetViewImage] = useState(null)
  const [streetViewLocation, setStreetViewLocation] = useState(null)
  const [mapDataPanelOpen, setMapDataPanelOpen] = useState(false)
  const [signGroups, setSignGroups] = useState([])
  const [objectGroups, setObjectGroups] = useState([])
  const [selectedSignGroupIds, setSelectedSignGroupIds] = useState(DEFAULT_SIGN_SELECTION)
  const [selectedObjectGroupIds, setSelectedObjectGroupIds] = useState(DEFAULT_OBJECT_SELECTION)
  const streetViewRequestIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function loadMapillaryCatalog() {
      try {
        const [signResponse, objectResponse] = await Promise.all([
          fetch('/mapillary-sprites/package_signs.json'),
          fetch('/mapillary-sprites/package_objects.json'),
        ])

        if (!signResponse.ok || !objectResponse.ok) {
          throw new Error('Mapillary filter catalog unavailable')
        }

        const [signManifest, objectManifest] = await Promise.all([
          signResponse.json(),
          objectResponse.json(),
        ])

        if (cancelled) return
        setSignGroups(buildSignGroups(signManifest))
        setObjectGroups(buildObjectGroups(objectManifest))
      } catch {
        if (cancelled) return
        setSignGroups([])
        setObjectGroups([])
      }
    }

    loadMapillaryCatalog()
    return () => {
      cancelled = true
    }
  }, [])

  const fetchRoutes = useCallback(async (orig, dest) => {
    setLoading(true)
    setError(null)
    setSafeRoute(null)
    setFastRoute(null)
    setPanelOpen(false)
    try {
      const [safe, fast] = await Promise.all([
        getSafeRoute(orig.lat, orig.lng, dest.lat, dest.lng),
        getFastRoute(orig.lat, orig.lng, dest.lat, dest.lng),
      ])
      setSafeRoute(safe)
      setFastRoute(fast)
      setPanelOpen(true)
    } catch {
      setError('Could not fetch routes. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOriginSelect = useCallback((place) => {
    setOrigin(place)
    setError(null)
  }, [])

  const handleDestinationSelect = useCallback((place) => {
    setDestination(place)
    setError(null)
  }, [])

  const handleSearch = useCallback(() => {
    if (!origin || !destination || loading) return
    fetchRoutes(origin, destination)
  }, [destination, fetchRoutes, loading, origin])

  const handleReset = useCallback(() => {
    setOrigin(null)
    setDestination(null)
    setSafeRoute(null)
    setFastRoute(null)
    setPanelOpen(false)
    setError(null)
  }, [])

  const handleStreetViewClose = useCallback(() => {
    setStreetViewOpen(false)
  }, [])

  const handleMapDataReset = useCallback(() => {
    setSelectedSignGroupIds(DEFAULT_SIGN_SELECTION)
    setSelectedObjectGroupIds(DEFAULT_OBJECT_SELECTION)
  }, [])

  const handleMapClick = useCallback(async ({ lat, lng }) => {
    const requestId = streetViewRequestIdRef.current + 1
    streetViewRequestIdRef.current = requestId

    setStreetViewLocation({ lat, lng })
    setStreetViewOpen(true)
    setStreetViewLoading(true)
    setStreetViewError(null)

    if (!HAS_MAPILLARY_TOKEN) {
      setStreetViewImage(null)
      setStreetViewLoading(false)
      setStreetViewError('Add VITE_MAPILLARY_TOKEN to load Mapillary street view.')
      return
    }

    try {
      const image = await getNearestMapillaryImage(lat, lng)
      if (streetViewRequestIdRef.current !== requestId) return

      if (!image) {
        setStreetViewImage(null)
        setStreetViewError('No Mapillary imagery found near this point.')
        return
      }

      setStreetViewImage(image)
    } catch (streetViewFetchError) {
      if (streetViewRequestIdRef.current !== requestId) return
      setStreetViewImage(null)
      setStreetViewError(
        streetViewFetchError?.message || 'Street-view lookup failed.'
      )
    } finally {
      if (streetViewRequestIdRef.current === requestId) {
        setStreetViewLoading(false)
      }
    }
  }, [])

  const mapillaryTrafficSignValues = resolveSelectedValues(signGroups, selectedSignGroupIds)
  const mapillaryPointValues = resolveSelectedValues(objectGroups, selectedObjectGroupIds)
  const showMapillaryTrafficSigns = selectedSignGroupIds.length > 0
  const showMapillaryPoints = selectedObjectGroupIds.length > 0

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at top left, rgba(217,239,146,0.12), transparent 26%),
          radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 22%),
          linear-gradient(180deg, rgba(5,8,12,0.18) 0%, rgba(5,8,12,0.3) 100%)
        `,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      {HAS_MAPBOX_TOKEN ? (
        <>
          <MapView
            mapTheme={mapTheme}
            safeRoute={safeRoute}
            fastRoute={fastRoute}
            origin={origin}
            destination={destination}
            showMapillaryTrafficSigns={showMapillaryTrafficSigns}
            showMapillaryPoints={showMapillaryPoints}
            mapillaryTrafficSignValues={mapillaryTrafficSignValues}
            mapillaryPointValues={mapillaryPointValues}
            onMapClick={handleMapClick}
          />
          <div style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            zIndex: 26,
            display: 'flex',
            padding: '6px',
            borderRadius: '999px',
            background: 'rgba(10, 14, 18, 0.82)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.22)',
          }}>
            <ThemeToggle
              mapTheme={mapTheme}
              onToggle={() => setMapTheme((current) => current === 'dark' ? 'light' : 'dark')}
            />
          </div>
          <SearchBar
            onOriginSelect={handleOriginSelect}
            onDestinationSelect={handleDestinationSelect}
            onSearch={handleSearch}
            origin={origin}
            destination={destination}
            loading={loading}
            onReset={handleReset}
            canSearch={Boolean(origin && destination)}
            mapDataPanelOpen={mapDataPanelOpen}
            onToggleMapDataPanel={() => setMapDataPanelOpen((value) => !value)}
            mapDataPanel={(
              <MapDataPanel
                open={mapDataPanelOpen}
                signGroups={signGroups}
                objectGroups={objectGroups}
                selectedSignGroupIds={selectedSignGroupIds}
                selectedObjectGroupIds={selectedObjectGroupIds}
                onSelectAllSigns={() => setSelectedSignGroupIds(['all'])}
                onClearSigns={() => setSelectedSignGroupIds([])}
                onAddSignGroup={(groupId) => {
                  setSelectedSignGroupIds((current) => {
                    const next = current.includes('all') ? [] : current
                    return next.includes(groupId) ? next : [...next, groupId]
                  })
                }}
                onRemoveSignGroup={(groupId) => {
                  if (groupId === 'all') {
                    setSelectedSignGroupIds([])
                    return
                  }
                  setSelectedSignGroupIds((current) => current.filter((id) => id !== groupId))
                }}
                onSelectAllObjects={() => setSelectedObjectGroupIds(['all'])}
                onClearObjects={() => setSelectedObjectGroupIds([])}
                onAddObjectGroup={(groupId) => {
                  setSelectedObjectGroupIds((current) => {
                    const next = current.includes('all') ? [] : current
                    return next.includes(groupId) ? next : [...next, groupId]
                  })
                }}
                onRemoveObjectGroup={(groupId) => {
                  if (groupId === 'all') {
                    setSelectedObjectGroupIds([])
                    return
                  }
                  setSelectedObjectGroupIds((current) => current.filter((id) => id !== groupId))
                }}
                onReset={handleMapDataReset}
                onClose={() => setMapDataPanelOpen(false)}
              />
            )}
          />
          {!streetViewOpen && (
            <div className="street-view-hint">
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.12em',
                color: 'var(--accent-safe)',
              }}>
                STREET VIEW
              </span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                Click any point on the map to open the nearest Mapillary scene.
                {HAS_MAPILLARY_TOKEN
                  ? ' Traffic signs and map objects can be refined from the Map Data panel.'
                  : ''}
              </span>
            </div>
          )}
        </>
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: 'radial-gradient(circle at top, rgba(61,142,240,0.18), transparent 42%), var(--bg-base)',
        }}>
          <div style={{
            width: 'min(560px, 100%)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-bright)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-panel)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--text-primary)',
            }}>
              Mapbox setup required
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              Create a <code>.env.local</code> file and add your public Mapbox token as <code>VITE_MAPBOX_TOKEN</code>.
            </div>
            <pre style={{
              margin: 0,
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--accent-safe)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              overflowX: 'auto',
            }}>{`VITE_MAPBOX_TOKEN=pk.your_public_token_here
VITE_MAPILLARY_TOKEN=MLY|your_mapillary_token_here
VITE_API_URL=http://localhost:8000`}</pre>
          </div>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18, 24, 30, 0.88)',
          border: '1px solid rgba(255, 107, 107, 0.34)',
          borderRadius: '999px',
          padding: '12px 18px',
          color: '#ffc0c0',
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(14px)',
          zIndex: 25,
          animation: 'fadeUp 0.3s ease',
        }}>
          {error}
        </div>
      )}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          zIndex: 25,
          padding: '14px 18px',
          borderRadius: '18px',
          background: 'rgba(10, 14, 18, 0.34)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent-safe)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.28))',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-primary)',
            letterSpacing: '0.1em',
            textShadow: '0 2px 10px rgba(0,0,0,0.45)',
          }}>
            COMPUTING SAFETY MESH...
          </span>
        </div>
      )}
      {safeRoute && fastRoute && (
        <SafetyPanel
          safeRoute={safeRoute}
          fastRoute={fastRoute}
          open={panelOpen}
          onToggle={() => setPanelOpen(v => !v)}
        />
      )}
      <StreetViewPanel
        open={streetViewOpen}
        image={streetViewImage}
        loading={streetViewLoading}
        error={streetViewError}
        location={streetViewLocation}
        onClose={handleStreetViewClose}
      />
      <SOSButton />
    </div>
  )
}

function ThemeToggle({ mapTheme, onToggle }) {
  const isDark = mapTheme === 'dark'

  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        borderRadius: '999px',
        width: '48px',
        height: '48px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
        color: isDark ? 'var(--accent-safe)' : 'var(--text-primary)',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        transition: 'background 0.2s ease, color 0.2s ease, transform 0.2s ease',
      }}
      aria-label={isDark ? 'Switch to light map theme' : 'Switch to dark map theme'}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 3V5.5M12 18.5V21M4.93 4.93L6.7 6.7M17.3 17.3L19.07 19.07M3 12H5.5M18.5 12H21M4.93 19.07L6.7 17.3M17.3 6.7L19.07 4.93" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 9 9 0 1 0 20 15.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}

function resolveSelectedValues(groups, selectedIds) {
  if (selectedIds.includes('all')) return null
  if (!selectedIds.length) return []

  const values = groups
    .filter((group) => selectedIds.includes(group.id))
    .flatMap((group) => group.values)

  return [...new Set(values)]
}

function buildSignGroups(manifest) {
  const values = Object.keys(manifest)
  return [
    createGroup('regulatory', 'Regulatory', values, (value) => value.startsWith('regulatory--')),
    createGroup('warning', 'Warning', values, (value) => value.startsWith('warning--')),
    createGroup('information', 'Information', values, (value) => value.startsWith('information--')),
    createGroup('complementary', 'Complementary', values, (value) => value.startsWith('complementary--')),
  ].filter((group) => group.values.length)
}

function buildObjectGroups(manifest) {
  const values = Object.keys(manifest)
  return [
    createGroup('street-furniture', 'Street furniture', values, (value) => [
      'object--banner',
      'object--bench',
      'object--bike-rack',
      'object--catch-basin',
      'object--cctv-camera',
      'object--fire-hydrant',
      'object--junction-box',
      'object--mailbox',
      'object--manhole',
      'object--parking-meter',
      'object--phone-booth',
      'object--street-light',
      'object--trash-can',
      'object--water-valve',
    ].includes(value)),
    createGroup('signs-displays', 'Signs and displays', values, (value) => value.startsWith('object--sign--')),
    createGroup('supports', 'Supports and poles', values, (value) => value.startsWith('object--support--')),
    createGroup('traffic-lights', 'Traffic lights', values, (value) => value.startsWith('object--traffic-light--')),
    createGroup('traffic-control', 'Traffic control', values, (value) => value === 'object--traffic-cone'),
    createGroup('road-markings', 'Road markings', values, (value) => value.startsWith('marking--')),
    createGroup('construction', 'Construction', values, (value) => value.startsWith('construction--')),
  ].filter((group) => group.values.length)
}

function createGroup(id, label, values, predicate) {
  return {
    id,
    label,
    values: values.filter(predicate),
  }
}
