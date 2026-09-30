import type { Point } from 'geojson'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  roundCollection,
  roundCoordinateValue,
  transformCollection,
  transformCoordinate,
} from './coordinates'

describe('坐标转换', () => {
  it('同坐标系时不改变坐标', () => {
    expect(transformCoordinate(121.482, 31.236, 'WGS84', 'WGS84')).toEqual([
      121.482, 31.236,
    ])
  })

  it('WGS84 与 GCJ-02 往返转换后接近原值', () => {
    const [lng, lat] = transformCoordinate(121.482, 31.236, 'WGS84', 'GCJ-02')
    const [backLng, backLat] = transformCoordinate(lng, lat, 'GCJ-02', 'WGS84')
    expect(backLng).toBeCloseTo(121.482, 5)
    expect(backLat).toBeCloseTo(31.236, 5)
  })

  it('转换 FeatureCollection 保留要素 ID', () => {
    const data = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          id: 'point-1',
          properties: { name: '测试点' },
          geometry: {
            type: 'Point' as const,
            coordinates: [116.404, 39.915],
          },
        },
      ],
    }
    const converted = transformCollection(data, 'WGS84', 'GCJ-02')
    expect(converted.features[0].id).toBe('point-1')
    expect(converted.features[0].properties?.name).toBe('测试点')
    const geometry = converted.features[0].geometry as Point
    expect(geometry.coordinates).not.toEqual([116.404, 39.915])
  })
})

describe('坐标小数位规范化', () => {
  it('将过长浮点四舍五入到 6 位', () => {
    expect(roundCoordinateValue(121.53779775852013)).toBe(121.537798)
    expect(roundCoordinateValue(29.83242362981096)).toBe(29.832424)
  })

  it('规范化 FeatureCollection 内全部坐标', () => {
    const rounded = roundCollection({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'poly-1',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [121.53779775852013, 29.83242362981096],
                [121.54, 29.83],
                [121.53779775852013, 29.83242362981096],
              ],
            ],
          },
        },
      ],
    })
    const ring = (
      rounded.features[0].geometry as {
        coordinates: number[][][]
      }
    ).coordinates[0]
    expect(ring[0]).toEqual([121.537798, 29.832424])
    expect(ring[1]).toEqual([121.54, 29.83])
  })
})

describe('mapKeys 存储', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem(key: string) {
        return storage.get(key) ?? null
      },
      setItem(key: string, value: string) {
        storage.set(key, value)
      },
      removeItem(key: string) {
        storage.delete(key)
      },
    })
  })

  it('读写 API Key', async () => {
    const { getMapKey, hasMapKey, setMapKey, clearMapKey } = await import(
      './mapKeys'
    )
    expect(hasMapKey('tianditu')).toBe(false)
    setMapKey('tianditu', 'test-key-123')
    expect(hasMapKey('tianditu')).toBe(true)
    expect(getMapKey('tianditu')).toBe('test-key-123')
    clearMapKey('tianditu')
    expect(hasMapKey('tianditu')).toBe(false)
  })

  it('忽略空白 Key', async () => {
    const { hasMapKey, setMapKey } = await import('./mapKeys')
    setMapKey('gaode', '   ')
    expect(hasMapKey('gaode')).toBe(false)
  })

  it('将旧版 gcj 导出目标迁移为 gaode', async () => {
    storage.set('geojson-studio-target-platform-v1', 'gcj')
    const { getSavedTargetPlatform } = await import('./mapKeys')
    expect(getSavedTargetPlatform()).toBe('gaode')
  })
})
