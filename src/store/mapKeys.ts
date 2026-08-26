import type { TargetPlatform } from '../data/coordSystems'
import type { MapKeyProvider } from '../data/basemaps'
import { DEFAULT_BASEMAP_ID } from '../data/basemaps'

const MAP_KEYS_STORAGE = 'geojson-studio-map-keys-v1'
const BASEMAP_STORAGE = 'geojson-studio-basemap-v1'
const TARGET_PLATFORM_STORAGE = 'geojson-studio-target-platform-v1'

export interface MapApiKeys {
  tianditu?: string
  gaode?: string
  baidu?: string
}

export function getMapKeys(): MapApiKeys {
  try {
    const raw = localStorage.getItem(MAP_KEYS_STORAGE)
    if (!raw) return {}
    return JSON.parse(raw) as MapApiKeys
  } catch {
    return {}
  }
}

export function setMapKey(provider: MapKeyProvider, key: string): void {
  const trimmed = key.trim()
  if (!trimmed) return
  const keys = getMapKeys()
  keys[provider] = trimmed
  localStorage.setItem(MAP_KEYS_STORAGE, JSON.stringify(keys))
}

export function clearMapKey(provider: MapKeyProvider): void {
  const keys = getMapKeys()
  delete keys[provider]
  localStorage.setItem(MAP_KEYS_STORAGE, JSON.stringify(keys))
}

export function hasMapKey(provider: MapKeyProvider): boolean {
  return Boolean(getMapKeys()[provider]?.trim())
}

export function getMapKey(provider: MapKeyProvider): string | undefined {
  return getMapKeys()[provider]?.trim()
}

export function getSavedBasemapId(): string {
  try {
    return localStorage.getItem(BASEMAP_STORAGE) ?? DEFAULT_BASEMAP_ID
  } catch {
    return DEFAULT_BASEMAP_ID
  }
}

export function setSavedBasemapId(basemapId: string): void {
  localStorage.setItem(BASEMAP_STORAGE, basemapId)
}

export function getSavedTargetPlatform(): TargetPlatform {
  try {
    const value = localStorage.getItem(TARGET_PLATFORM_STORAGE)
    if (value === 'gcj' || value === 'baidu' || value === 'international') {
      return value
    }
  } catch {
    // 隐私模式或存储不可用时使用默认值。
  }
  return 'international'
}

export function setSavedTargetPlatform(platform: TargetPlatform): void {
  localStorage.setItem(TARGET_PLATFORM_STORAGE, platform)
}
