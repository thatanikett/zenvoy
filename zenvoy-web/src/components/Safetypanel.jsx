import { useState } from 'react'

export default function SafetyPanel({ safeRoute, fastRoute, open, onToggle }) {
  const [activeTab, setActiveTab] = useState('safe')

  const safe = normalizeRouteMetrics(safeRoute)
  const fast = normalizeRouteMetrics(fastRoute)

  const current = activeTab === 'safe' ? safe : fast
  const isSafe  = activeTab === 'safe'
  const currentRoute = isSafe ? safeRoute : fastRoute
  const insight = getInsight(currentRoute)

  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      right: '24px',
      bottom: '24px',
      width: '400px',
      zIndex: 32,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      pointerEvents: 'none',
    }}>
      <button
        onClick={onToggle}
        style={{
          pointerEvents: 'all',
          alignSelf: 'flex-end',
          marginBottom: '10px',
          background: 'rgba(11,15,20,0.78)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '999px',
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{
          width: '8px', height: '8px',
          borderRadius: '999px',
          background: activeTab === 'safe' ? 'var(--accent-safe)' : 'var(--accent-danger)',
        }} />
        {open ? 'HIDE ANALYSIS' : 'SHOW ANALYSIS'}
      </button>

      <div style={{
        pointerEvents: 'all',
        flex: 1,
        background: 'linear-gradient(180deg, rgba(12,16,21,0.94) 0%, rgba(12,16,21,0.84) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '30px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.42)',
        backdropFilter: 'blur(18px)',
        transform: open ? 'translateX(0)' : 'translateX(calc(100% + 20px))',
        transition: 'transform 0.35s cubic-bezier(0.32, 0, 0, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          padding: '22px 22px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--text-muted)',
                letterSpacing: '0.16em',
                marginBottom: '8px',
              }}>
                AI SAFETY INSPECTOR
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}>
                {isSafe ? 'Safe route logic' : 'Fast route tradeoff'}
              </div>
            </div>
            <ScoreBadge
              value={current.overall_score}
              label="SCORE"
              tone={isSafe ? 'var(--accent-safe)' : 'var(--accent-danger)'}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
          }}>
            <TabButton
              label="SAFE"
              sub={`${safe.estMinutes} MIN`}
              active={activeTab === 'safe'}
              color="var(--accent-safe)"
              onClick={() => setActiveTab('safe')}
            />
            <TabButton
              label="FAST"
              sub={`${fast.estMinutes} MIN`}
              active={activeTab === 'fast'}
              color="var(--accent-danger)"
              onClick={() => setActiveTab('fast')}
            />
          </div>
        </div>

        <div style={{
          padding: '20px 22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          overflowY: 'auto',
        }}>
          <div>
            <SectionLabel text="AI SUMMARY" />
            <p style={{
              marginTop: '10px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              lineHeight: 1.65,
            }}>
              {insight.summary}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '18px 22px',
          }}>
            <MetricLine label="Distance" value={`${current.distanceKm} km`} tone="var(--text-primary)" />
            <MetricLine label="Travel time" value={`${current.estMinutes} min`} tone="var(--text-primary)" />
            <MetricLine label="Lighting" value={`${current.lighting_pct}%`} tone={getLightingTone(current.lighting_pct)} />
            <MetricLine label="Crime signals" value={current.crime_count === 0 ? 'Clear' : `${current.crime_count} reports`} tone={getSeverityTone(current.crime_severity)} />
            <MetricLine label="Severity" value={current.crime_severity} tone={getSeverityTone(current.crime_severity)} />
            <MetricLine label="Visual edges" value={String(current.visualEdgesAnalyzed)} tone="var(--text-primary)" />
            <MetricLine label="Crime weight" value={current.weightedCrimeSeverity} tone={getSeverityTone(current.crime_severity)} />
            <MetricLine label="Avg penalty" value={current.avgCrimePenalty} tone="var(--text-primary)" />
          </div>

          <div>
            <SectionLabel text="RECENT CRIMES" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {current.recentCrimes.map((crime, index) => (
                <CrimeRow key={`${crime.type}-${crime.timestamp}-${index}`} crime={crime} />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel text="ROUTE SIGNALS" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {insight.flaggedSegments.map((item, index) => (
                <SignalRow key={index} text={item} variant={isSafe ? 'safe' : 'warn'} />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel text="ROUTE CALLOUTS" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {current.callouts.map((item, index) => (
                <SignalRow key={index} text={item} variant={isSafe ? 'safe' : 'warn'} />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel text="PREVIEW NODES" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <PreviewRow
                label="Origin preview"
                preview={current.originPreview}
              />
              <PreviewRow
                label="Destination preview"
                preview={current.destinationPreview}
              />
            </div>
          </div>

          <div>
            <SectionLabel text="CONNAUGHT PLACE" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <SignalRow
                text={current.passesConnaughtPlace
                  ? 'Route passes through Connaught Place.'
                  : 'Route does not pass through Connaught Place.'}
                variant={current.passesConnaughtPlace ? 'warn' : 'safe'}
              />
              <SignalRow
                text={`Mapillary images on this segment: ${current.connaughtPlaceImages}`}
                variant={current.connaughtPlaceImages > 0 ? 'safe' : 'warn'}
              />
            </div>
          </div>

          <div style={{
            paddingTop: '18px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <SectionLabel text="RECOMMENDATION" />
            <p style={{
              marginTop: '10px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              lineHeight: 1.6,
            }}>
              {insight.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({ label, sub, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: `1px solid ${active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
        borderRadius: '18px',
        padding: '12px 14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        alignItems: 'flex-start',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.14em',
        color: active ? color : 'var(--text-muted)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}>
        {sub}
      </span>
    </button>
  )
}

function ScoreBadge({ value, label, tone }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '86px',
      minHeight: '86px',
      borderRadius: '26px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '24px',
        fontWeight: '600',
        color: tone,
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'var(--text-muted)',
        letterSpacing: '0.14em',
      }}>
        {label}
      </span>
    </div>
  )
}

function SectionLabel({ text }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      color: 'var(--text-muted)',
      letterSpacing: '0.16em',
    }}>
      {text}
    </div>
  )
}

function MetricLine({ label, value, tone }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--text-muted)',
        letterSpacing: '0.12em',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '18px',
        color: tone,
        lineHeight: 1.2,
      }}>
        {value}
      </span>
    </div>
  )
}

function ReasonStep({ index, text, tone }) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '999px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
        color: tone,
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}>
        {index}
      </div>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
      }}>
        {text}
      </span>
    </div>
  )
}

function SignalRow({ text, variant }) {
  const tone = variant === 'safe' ? 'var(--accent-safe)' : 'var(--accent-warn)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '999px',
        background: tone,
        flexShrink: 0,
      }} />
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
      }}>
        {text}
      </div>
    </div>
  )
}

function CrimeRow({ crime }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 14px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--accent-warn)',
          letterSpacing: '0.12em',
        }}>
          {formatCrimeType(crime.type)}
        </span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}>
          {crime.distance_m != null ? `${crime.distance_m.toFixed(1)} m away` : 'Distance unavailable'}
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        lineHeight: 1.55,
        color: 'var(--text-primary)',
      }}>
        {crime.description || 'Incident details unavailable.'}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        <span>Severity: {formatDecimal(crime.severity)}</span>
        <span>{formatDateTime(crime.timestamp)}</span>
      </div>
    </div>
  )
}

function PreviewRow({ label, preview }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 14px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--text-muted)',
        letterSpacing: '0.12em',
      }}>
        {label.toUpperCase()}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--text-primary)',
      }}>
        Node {preview.nodeId}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}>
        {preview.imageAvailable
          ? 'Street-view preview available.'
          : 'No preview image available from backend.'}
      </span>
    </div>
  )
}

function getInsight(route) {
  const score = route?.score || route?.score_breakdown || {}
  const recentCrimes = getCrimeReports(route, score)
  const crimeCount = score.crime_count ?? route?.crime_count ?? recentCrimes.length ?? 0
  const connaughtPlace = route?.connaught_place || {}
  const passesConnaughtPlace = Boolean(connaughtPlace.passes_connaught_place)

  const analysis =
    route?.ai_analysis ||
    route?.analysis ||
    route?.thought_process ||
    route?.score_breakdown?.ai_analysis ||
    {}

  const reasoning = normalizeList(
    analysis.reasoning ||
    analysis.thought_process ||
    analysis.steps
  )

  const flaggedSegments = normalizeList(
    analysis.flagged_segments ||
    analysis.risk_segments ||
    analysis.alerts
  )

  const fallbackSummary = [
    `This ${route?.type || 'route'} covers ${formatDecimal(route?.distance_km)} km in approximately ${route?.estimated_time_min ?? 0} minutes.`,
    `Lighting coverage is ${score.lighting_score_pct ?? 0}% with ${crimeCount} nearby crime signals.`,
    passesConnaughtPlace
      ? 'The route passes through Connaught Place.'
      : 'The route avoids Connaught Place.',
  ].join(' ')

  const fallbackFlags = recentCrimes.length
    ? recentCrimes.slice(0, 3).map((crime) => {
        const distance = crime.distance_m != null ? `${crime.distance_m.toFixed(1)} m away` : 'distance unavailable'
        return `${formatCrimeType(crime.type)}: ${crime.description || 'No description'} (${distance}).`
      })
    : ['No recent crimes were supplied by the backend for this route.']

  const fallbackRecommendation = score.overall_safety_score >= 7
    ? 'This route currently has the stronger safety score and is the better default choice.'
    : 'This route has weaker safety signals. Review the reported incidents before choosing it.'

  return {
    summary: analysis.summary || fallbackSummary,
    confidencePct: analysis.confidence_pct ?? analysis.confidence ?? null,
    reasoning: reasoning.length ? reasoning : ['The backend did not provide an AI thought process for this route.'],
    flaggedSegments: flaggedSegments.length ? flaggedSegments : fallbackFlags,
    recommendation: analysis.recommendation || fallbackRecommendation,
  }
}

function normalizeRouteMetrics(route) {
  const breakdown = route?.score || route?.score_breakdown || route?.metrics || {}
  const recentCrimes = getCrimeReports(route, breakdown)
  const previewOrigin = route?.origin_preview || {}
  const previewDestination = route?.destination_preview || {}
  const connaughtPlace = route?.connaught_place || {}
  const callouts = [
    ...(Array.isArray(breakdown.callouts) ? breakdown.callouts : []),
    ...(Array.isArray(route?.callouts) ? route.callouts : []),
  ]

  return {
    lighting_pct:
      breakdown.lighting_pct ??
      breakdown.lighting_score_pct ??
      route?.lighting_pct ??
      0,
    crime_count:
      breakdown.crime_count ??
      route?.crime_count ??
      (recentCrimes.length || 0),
    crime_severity:
      breakdown.crime_severity ??
      breakdown.crime_density ??
      route?.crime_severity ??
      'Unknown',
    overall_score:
      breakdown.overall_score ??
      breakdown.overall_safety_score ??
      route?.overall_score ??
      0,
    estMinutes:
      breakdown.est_minutes ??
      route?.estimated_time_min ??
      route?.duration_min ??
      0,
    distanceKm: formatDecimal(route?.distance_km),
    weightedCrimeSeverity: formatDecimal(breakdown.weighted_crime_severity),
    avgCrimePenalty: formatDecimal(breakdown.avg_crime_penalty),
    visualEdgesAnalyzed: breakdown.visual_edges_analyzed ?? 0,
    recentCrimes: recentCrimes.length
      ? recentCrimes
      : [{ type: 'clear', description: 'No recent crimes were returned for this route.' }],
    originPreview: {
      nodeId: previewOrigin.node_id || 'Unavailable',
      imageAvailable: Boolean(previewOrigin.image_available),
    },
    destinationPreview: {
      nodeId: previewDestination.node_id || 'Unavailable',
      imageAvailable: Boolean(previewDestination.image_available),
    },
    passesConnaughtPlace: Boolean(connaughtPlace.passes_connaught_place),
    connaughtPlaceImages: Array.isArray(connaughtPlace.images) ? connaughtPlace.images.length : 0,
    callouts: callouts.length
      ? callouts
      : buildFallbackCallouts(route, breakdown, connaughtPlace),
  }
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function getCrimeReports(route, breakdown = {}) {
  const reports = [
    ...(Array.isArray(breakdown.recent_crimes) ? breakdown.recent_crimes : []),
    ...(Array.isArray(breakdown.crime_reports) ? breakdown.crime_reports : []),
    ...(Array.isArray(route?.crime_reports) ? route.crime_reports : []),
    ...(Array.isArray(route?.recent_crimes) ? route.recent_crimes : []),
  ]

  if (!reports.length) return []

  const seen = new Set()

  return reports.filter((report, index) => {
    const key = report?.id || `${report?.type || 'unknown'}-${report?.timestamp || 'na'}-${report?.lat || 'na'}-${report?.lng || 'na'}-${index}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function getLightingTone(value) {
  if (value >= 60) return 'var(--accent-safe)'
  if (value >= 40) return 'var(--accent-warn)'
  return 'var(--accent-danger)'
}

function getSeverityTone(value) {
  const normalized = String(value || '').toLowerCase()

  if (normalized === 'low') return 'var(--accent-safe)'
  if (normalized === 'medium') return 'var(--accent-warn)'
  return 'var(--accent-danger)'
}

function buildFallbackCallouts(route, score, connaughtPlace) {
  return [
    `Route type: ${(route?.type || 'unknown').toUpperCase()}`,
    `Distance ${formatDecimal(route?.distance_km)} km with ETA ${route?.estimated_time_min ?? 0} min`,
    `${score.crime_count ?? 0} nearby crime reports with lighting at ${score.lighting_score_pct ?? 0}%`,
    connaughtPlace?.passes_connaught_place
      ? 'Passes through Connaught Place'
      : 'Does not pass through Connaught Place',
  ]
}

function formatDecimal(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0.00'
  return number.toFixed(2)
}

function formatDateTime(value) {
  if (!value) return 'Time unavailable'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCrimeType(value) {
  if (!value) return 'INCIDENT'
  return String(value).replace(/_/g, ' ').toUpperCase()
}
