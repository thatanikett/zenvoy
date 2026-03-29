import apiClient from './apiClient'

type RouteType = 'safe' | 'fast'

type RouteCoordinate = [number, number]

interface RouteScore {
  overall_safety_score: number
  lighting_score_pct: number
  crime_count: number
  recent_crimes: unknown[]
  avg_crime_penalty: number
  weighted_crime_severity: number
  avg_visual_score: number
  visual_edges_analyzed: number
}

interface RoutePreview {
  node_id: string
  image_url: string | null
  image_available: boolean
  coordinates: RouteCoordinate
}

interface ConnaughtPlaceInfo {
  passes_connaught_place: boolean
  images: string[]
}

export interface RouteResponse {
  type: RouteType
  coordinates: RouteCoordinate[]
  distance_km: number
  estimated_time_min: number
  score: RouteScore
  origin_preview: RoutePreview
  destination_preview: RoutePreview
  connaught_place: ConnaughtPlaceInfo
}

// Define type for SOS response
interface SOSResponse {
  status: string
  message: string
}

export async function fetchSafeRoute(
  origin_lat: number,
  origin_lng: number,
  dest_lat: number,
  dest_lng: number
): Promise<RouteResponse> {
  const response = await apiClient.get<RouteResponse>('/route/safe', {
    params: { origin_lat, origin_lng, dest_lat, dest_lng },
  })

  return response.data
}

export async function fetchFastRoute(
  origin_lat: number,
  origin_lng: number,
  dest_lat: number,
  dest_lng: number
): Promise<RouteResponse> {
  const response = await apiClient.get<RouteResponse>('/route/fast', {
    params: { origin_lat, origin_lng, dest_lat, dest_lng },
  })

  return response.data
}

export async function postSOS(
  lat: number,
  lng: number,
  userName: string,
  contactNumber: string
): Promise<SOSResponse> {
  const response = await apiClient.post<SOSResponse>('/sos', {
    lat,
    lng,
    user_name: userName,
    contact_number: contactNumber,
  })

  return response.data
}