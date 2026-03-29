import apiClient from './apiClient'

export async function fetchSafeRoute(origin_lat, origin_lng, dest_lat, dest_lng) {
  const response = await apiClient.get('/route/safe', {
    params: { origin_lat, origin_lng, dest_lat, dest_lng },
  })

  return response.data
}

export async function fetchFastRoute(origin_lat, origin_lng, dest_lat, dest_lng) {
  const response = await apiClient.get('/route/fast', {
    params: { origin_lat, origin_lng, dest_lat, dest_lng },
  })

  return response.data
}

export async function postSOS(lat, lng, userName, contactNumber) {
  const response = await apiClient.post('/sos', {
    lat,
    lng,
    user_name: userName,
    contact_number: contactNumber,
  })

  return response.data
}
