import { fetchFastRoute, fetchSafeRoute, postSOS } from './services/routesService'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ─────────────────────────────────────────────
//  MOCK DATA
//  Hauz Khas Metro → Hauz Khas Village
//  Safe route takes main road, fast route cuts through dark gali
// ─────────────────────────────────────────────
export const MOCK_SAFE_ROUTE = {
  coordinates: [
    [28.5433, 77.2066],
    [28.5441, 77.2058],
    [28.5449, 77.2049],
    [28.5456, 77.2039],
    [28.5463, 77.2029],
    [28.5470, 77.2018],
    [28.5478, 77.2008],
  ],
  score_breakdown: {
    lighting_pct: 88,
    crime_count: 0,
    crime_severity: 'Low',
    overall_score: 8.6,
    est_minutes: 13,
    callouts: [
      'Passes 2 well-lit main roads',
      'CCTV detected at 3 intersections',
    ],
  },
  ai_analysis: {
    summary: 'Preferred route stays on brighter arterial streets with cleaner visibility and lower reported incident density.',
    confidence_pct: 91,
    reasoning: [
      'Lighting coverage remains consistently high across the longest stretch of the route.',
      'Crowd presence and intersection visibility reduce isolation risk after sunset.',
      'Crime signals remain low and distributed away from the chosen corridor.',
    ],
    flagged_segments: [
      'Short dim patch near Hauz Khas Village entry for approximately 120m.',
      'One medium-traffic crossing where vehicles reduce pedestrian comfort.',
    ],
    recommendation: 'Recommended for evening travel.',
  },
}

export const MOCK_FAST_ROUTE = {
  coordinates: [
    [28.5433, 77.2066],
    [28.5438, 77.2075],
    [28.5444, 77.2083],
    [28.5455, 77.2072],
    [28.5463, 77.2058],
    [28.5470, 77.2040],
    [28.5478, 77.2008],
  ],
  score_breakdown: {
    lighting_pct: 20,
    crime_count: 4,
    crime_severity: 'High',
    overall_score: 2.8,
    est_minutes: 9,
    callouts: [
      'Dark alley detected by AI vision',
      '3 snatch incidents reported nearby',
    ],
  },
  ai_analysis: {
    summary: 'Shorter route saves time but cuts through low-visibility stretches with materially weaker safety signals.',
    confidence_pct: 76,
    reasoning: [
      'The central shortcut includes multiple dark side lanes with weaker streetlight coverage.',
      'Recent incident clustering increases exposure around the narrowest segment.',
      'Fewer active storefronts and CCTV points reduce passive surveillance.',
    ],
    flagged_segments: [
      'Blind turn through alley cluster for approximately 180m.',
      'Sparse footfall between two intersections after 9 PM.',
    ],
    recommendation: 'Use only if time-critical and conditions are well lit.',
  },
}

// ─────────────────────────────────────────────
//  API FUNCTIONS
// ─────────────────────────────────────────────
export async function getSafeRoute(slat, slng, elat, elng) {
  if (USE_MOCK) {
    await delay(600)
    return MOCK_SAFE_ROUTE
  }
  return fetchSafeRoute(slat, slng, elat, elng)
}

export async function getFastRoute(slat, slng, elat, elng) {
  if (USE_MOCK) {
    await delay(600)
    return MOCK_FAST_ROUTE
  }
  return fetchFastRoute(slat, slng, elat, elng)
}

export async function sendSOS(lat, lng, userName, contactNumber) {
  if (USE_MOCK) {
    await delay(800)
    return { status: 'sent', message: 'Alert dispatched (mock)' }
  }
  return postSOS(lat, lng, userName, contactNumber)
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
