import { GraphDataProvider, S2GeometryProvider } from 'mapillary-js'

const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_TOKEN

const geometryProvider = new S2GeometryProvider()
const dataProvider = new GraphDataProvider({
  accessToken: MAPILLARY_TOKEN,
}, geometryProvider)

export async function getNearestMapillaryImage(lat, lng) {
  if (!MAPILLARY_TOKEN) {
    throw new Error('Mapillary token is missing.')
  }

  const center = { lat, lng }
  const cellId = geometryProvider.lngLatToCellId(center)
  const cellIds = [cellId, ...geometryProvider.getAdjacent(cellId)]

  const coreResponses = await Promise.all(
    unique(cellIds).map(async (id) => {
      try {
        return await dataProvider.getCoreImages(id)
      } catch {
        return { images: [] }
      }
    })
  )

  const candidates = uniqueById(
    coreResponses.flatMap((response) => response.images || [])
  )

  if (!candidates.length) {
    return null
  }

  const nearest = candidates.reduce((best, current) => {
    const bestDistance = distanceToPoint(best, center)
    const currentDistance = distanceToPoint(current, center)
    return currentDistance < bestDistance ? current : best
  })

  const details = await dataProvider.getImages([nearest.id])
  return details[0]?.node ?? nearest
}

function distanceToPoint(image, point) {
  const geometry = image.computed_geometry || image.geometry
  if (!geometry) return Number.POSITIVE_INFINITY

  const dLat = geometry.lat - point.lat
  const dLng = geometry.lng - point.lng

  return (dLat * dLat) + (dLng * dLng)
}

function unique(values) {
  return [...new Set(values)]
}

function uniqueById(images) {
  const seen = new Set()

  return images.filter((image) => {
    if (!image?.id || seen.has(image.id)) return false
    seen.add(image.id)
    return true
  })
}
