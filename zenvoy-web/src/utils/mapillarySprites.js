const SIGN_SPRITE_BASE = '/mapillary-sprites/package_signs'
const OBJECT_SPRITE_BASE = '/mapillary-sprites/package_objects'

const spriteLoadPromises = new WeakMap()

export async function ensureMapillarySprites(map) {
  if (map.hasImage('mapillary-sign-fallback') && map.hasImage('mapillary-object-fallback')) {
    return
  }

  const existingPromise = spriteLoadPromises.get(map)
  if (existingPromise) {
    await existingPromise
    return
  }

  const loadPromise = loadMapillarySprites(map)
    .finally(() => {
      spriteLoadPromises.delete(map)
    })

  spriteLoadPromises.set(map, loadPromise)
  await loadPromise
}

async function loadMapillarySprites(map) {
  const [
    signManifest,
    signSheet,
    objectManifest,
    objectSheet,
  ] = await Promise.all([
    loadSpriteManifest(`${SIGN_SPRITE_BASE}.json`),
    loadImage(`${SIGN_SPRITE_BASE}.png`),
    loadSpriteManifest(`${OBJECT_SPRITE_BASE}.json`),
    loadImage(`${OBJECT_SPRITE_BASE}.png`),
  ])

  addSpriteManifestToMap(map, signManifest, signSheet, 'mapillary-sign')
  addSpriteManifestToMap(map, objectManifest, objectSheet, 'mapillary-object')
  addFallbackIcon(map, 'mapillary-sign-fallback', '#ff6b5f', '#fff8f5')
  addFallbackIcon(map, 'mapillary-object-fallback', '#4cb6ff', '#eef8ff')
}

async function loadSpriteManifest(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load sprite manifest: ${url}`)
  }

  return response.json()
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load sprite image: ${url}`))
    image.src = url
  })
}

function addSpriteManifestToMap(map, manifest, sheet, prefix) {
  for (const [spriteName, spriteMeta] of Object.entries(manifest)) {
    const iconId = `${prefix}-${spriteName}`

    if (map.hasImage(iconId)) {
      continue
    }

    map.addImage(iconId, cropSprite(sheet, spriteMeta), {
      pixelRatio: spriteMeta.pixelRatio || 1,
      sdf: false,
    })
  }
}

function cropSprite(sheet, spriteMeta) {
  const canvas = document.createElement('canvas')
  canvas.width = spriteMeta.width
  canvas.height = spriteMeta.height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(
    sheet,
    spriteMeta.x,
    spriteMeta.y,
    spriteMeta.width,
    spriteMeta.height,
    0,
    0,
    spriteMeta.width,
    spriteMeta.height
  )

  return context.getImageData(0, 0, spriteMeta.width, spriteMeta.height)
}

function addFallbackIcon(map, iconId, fillColor, strokeColor) {
  if (map.hasImage(iconId)) {
    return
  }

  const size = 40
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  const center = size / 2
  const radius = 10

  context.fillStyle = fillColor
  context.strokeStyle = strokeColor
  context.lineWidth = 4
  context.beginPath()
  context.arc(center, center, radius, 0, Math.PI * 2)
  context.fill()
  context.stroke()

  map.addImage(iconId, context.getImageData(0, 0, size, size), {
    pixelRatio: 2,
    sdf: false,
  })
}
