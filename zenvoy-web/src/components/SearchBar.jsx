import { useEffect, useRef } from 'react'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import mapboxgl from 'mapbox-gl'

// Delhi/NCR bounding box to bias results
const DELHI_BBOX = [76.84, 28.40, 77.35, 28.88]

export default function SearchBar({
  onOriginSelect,
  onDestinationSelect,
  onSearch,
  origin,
  destination,
  loading,
  onReset,
  canSearch,
  mapDataPanelOpen,
  onToggleMapDataPanel,
  mapDataPanel,
}) {
  const originRef    = useRef(null)
  const destRef      = useRef(null)
  const originGeoRef = useRef(null)
  const destGeoRef   = useRef(null)

  // Init origin geocoder
  useEffect(() => {
    if (originGeoRef.current || !originRef.current) return
    const geo = new MapboxGeocoder({
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      mapboxgl,
      bbox: DELHI_BBOX,
      placeholder: 'Starting point...',
      countries: 'in',
      marker: false,
    })
    geo.addTo(originRef.current)
    geo.on('result', (e) => {
      if (!Array.isArray(e.result?.center) || e.result.center.length < 2) return
      const [lng, lat] = e.result.center
      onOriginSelect({ label: e.result.place_name, lat, lng })
    })
    originGeoRef.current = geo

    return () => {
      geo.clear()
      geo.onRemove()
      originGeoRef.current = null
    }
  }, [onOriginSelect])

  // Init destination geocoder
  useEffect(() => {
    if (destGeoRef.current || !destRef.current) return
    const geo = new MapboxGeocoder({
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      mapboxgl,
      bbox: DELHI_BBOX,
      placeholder: 'Where to?',
      countries: 'in',
      marker: false,
    })
    geo.addTo(destRef.current)
    geo.on('result', (e) => {
      if (!Array.isArray(e.result?.center) || e.result.center.length < 2) return
      const [lng, lat] = e.result.center
      onDestinationSelect({ label: e.result.place_name, lat, lng })
    })
    destGeoRef.current = geo

    return () => {
      geo.clear()
      geo.onRemove()
      destGeoRef.current = null
    }
  }, [onDestinationSelect])

  useEffect(() => {
    if (!originGeoRef.current) return

    if (!origin?.label) {
      originGeoRef.current.clear()
      return
    }

    originGeoRef.current.setInput(origin.label)
  }, [origin])

  useEffect(() => {
    if (!destGeoRef.current) return

    if (!destination?.label) {
      destGeoRef.current.clear()
      return
    }

    destGeoRef.current.setInput(destination.label)
  }, [destination])

  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      left: '24px',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '332px',
      animation: 'fadeUp 0.4s ease',
    }}>
      {mapDataPanel}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px 16px 14px',
        background: 'linear-gradient(180deg, rgba(11,15,20,0.88) 0%, rgba(11,15,20,0.72) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'linear-gradient(135deg, var(--accent-safe), #ffffff)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 24px rgba(217,239,146,0.25)',
            }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 7L7 13L1 7L7 1Z" stroke="#11161d" strokeWidth="1.5" fill="none"/>
                <circle cx="7" cy="7" r="2" fill="#11161d"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
              }}>
                ZENVOY
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.14em',
              }}>
                DELHI SAFETY MESH
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleMapDataPanel}
            style={{
              minWidth: '98px',
              height: '36px',
              padding: '0 14px',
              borderRadius: '999px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              border: '1px solid rgba(255,255,255,0.08)',
              color: mapDataPanelOpen ? 'var(--accent-safe)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 20px rgba(0,0,0,0.18)',
            }}
          >
            MAP DATA
          </button>
        </div>

        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          lineHeight: 1.45,
          color: 'var(--text-secondary)',
          maxWidth: '28ch',
        }}>
          Set your start and destination, then compare the safest and fastest route.
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingTop: '2px',
        }}>
          <LocationBlock
            label="SOURCE"
            accent="#76a8ff"
            selected={origin?.label}
            description="Where are you starting from?"
          >
            <div ref={originRef} className="geocoder-wrapper" />
          </LocationBlock>

          <div style={{
            marginLeft: '14px',
            width: '1px',
            height: '14px',
            background: 'linear-gradient(180deg, rgba(217,239,146,0.2), rgba(255,255,255,0))',
          }} />

          <LocationBlock
            label="DESTINATION"
            accent="var(--accent-safe)"
            selected={destination?.label}
            description="Where do you need to go?"
          >
            <div ref={destRef} className="geocoder-wrapper" />
          </LocationBlock>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '112px 1fr',
          gap: '10px',
          marginTop: '2px',
        }}>
          <button
            type="button"
            onClick={onReset}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              padding: '0 14px',
              minHeight: '52px',
            }}
          >
            CLEAR
          </button>

          <button
            type="button"
            onClick={onSearch}
            disabled={!canSearch || loading}
            style={{
              border: '1px solid transparent',
              borderRadius: '18px',
              background: canSearch && !loading
                ? 'linear-gradient(135deg, var(--accent-safe), #f8ffe0)'
                : 'rgba(255,255,255,0.06)',
              color: canSearch && !loading ? '#0a0f14' : 'var(--text-muted)',
              cursor: canSearch && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.14em',
              padding: '16px 18px',
              minHeight: '52px',
              boxShadow: canSearch && !loading ? '0 24px 44px rgba(217,239,146,0.18)' : 'none',
              transition: 'transform 0.15s ease, opacity 0.2s ease',
              opacity: canSearch || loading ? 1 : 0.75,
            }}
            onMouseDown={e => {
              if (canSearch && !loading) e.currentTarget.style.transform = 'scale(0.985)'
            }}
            onMouseUp={e => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {loading ? 'RUNNING SAFETY ANALYSIS' : 'SEARCH SAFEST VS FASTEST'}
          </button>
        </div>
      </div>

    </div>
  )
}

function LocationBlock({ label, accent, selected, description, children }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '999px',
          background: accent,
          boxShadow: `0 0 0 6px color-mix(in srgb, ${accent} 12%, transparent)`,
        }} />
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.16em',
        }}>
          {label}
        </div>
      </div>

      <div style={{
        padding: '12px 12px 10px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {children}
      </div>

      <div style={{
        minHeight: '34px',
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
        lineHeight: 1.45,
      }}>
        {selected || description}
      </div>
    </div>
  )
}
