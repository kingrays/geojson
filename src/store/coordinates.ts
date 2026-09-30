import gcoord from 'gcoord'
import type { Feature, GeoJsonProperties, Geometry } from 'geojson'
import {
  coordSysToGcoord,
  type CoordSysId,
} from '../data/coordSystems'
import type { EditorFeatureCollection } from './geojson'

/** 经纬度统一保留的小数位数（约 0.1m，兼顾可读性与地图精度） */
export const COORD_DECIMALS = 6

/** 将单个数值四舍五入到固定小数位 */
export function roundCoordinateValue(
  value: number,
  decimals: number = COORD_DECIMALS,
): number {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function roundPosition(position: number[]): number[] {
  // GeoJSON Position：[lng, lat] 或 [lng, lat, altitude]
  if (position.length < 2) return position
  const next = position.slice()
  next[0] = roundCoordinateValue(next[0])
  next[1] = roundCoordinateValue(next[1])
  if (typeof next[2] === 'number') {
    next[2] = roundCoordinateValue(next[2])
  }
  return next
}

function roundCoordTree(coords: unknown): unknown {
  if (!Array.isArray(coords) || coords.length === 0) return coords
  if (typeof coords[0] === 'number') {
    return roundPosition(coords as number[])
  }
  return coords.map((item) => roundCoordTree(item))
}

/** 规范化几何中的全部坐标 */
export function roundGeometry<G extends Geometry>(geometry: G): G {
  const cloned = JSON.parse(JSON.stringify(geometry)) as G
  if (cloned.type === 'GeometryCollection') {
    cloned.geometries = cloned.geometries.map((item) => roundGeometry(item))
    return cloned
  }
  if ('coordinates' in cloned) {
    ;(cloned as { coordinates: unknown }).coordinates = roundCoordTree(
      cloned.coordinates,
    )
  }
  return cloned
}

/** 规范化 FeatureCollection 中全部几何坐标 */
export function roundCollection(
  data: EditorFeatureCollection,
): EditorFeatureCollection {
  const cloned = JSON.parse(JSON.stringify(data)) as EditorFeatureCollection
  cloned.features = cloned.features.map((feature) =>
    feature.geometry
      ? { ...feature, geometry: roundGeometry(feature.geometry) }
      : feature,
  )
  return cloned
}

/** 同坐标系时跳过转换 */
export function transformCoordinate(
  lng: number,
  lat: number,
  from: CoordSysId,
  to: CoordSysId,
): [number, number] {
  if (from === to) {
    return [roundCoordinateValue(lng), roundCoordinateValue(lat)]
  }
  const [nextLng, nextLat] = gcoord.transform(
    [lng, lat],
    coordSysToGcoord(from),
    coordSysToGcoord(to),
  ) as [number, number]
  return [roundCoordinateValue(nextLng), roundCoordinateValue(nextLat)]
}

/** 深拷贝后转换 Feature 几何坐标，并统一小数位 */
export function transformFeature<G extends Geometry>(
  feature: Feature<G, GeoJsonProperties>,
  from: CoordSysId,
  to: CoordSysId,
): Feature<G, GeoJsonProperties> {
  const cloned = JSON.parse(JSON.stringify(feature)) as Feature<
    G,
    GeoJsonProperties
  >

  if (from !== to && cloned.geometry) {
    gcoord.transform(
      cloned.geometry as Parameters<typeof gcoord.transform>[0],
      coordSysToGcoord(from),
      coordSysToGcoord(to),
    )
  }

  if (cloned.geometry) {
    cloned.geometry = roundGeometry(cloned.geometry)
  }
  return cloned
}

/** 深拷贝后转换整个 FeatureCollection，并统一小数位 */
export function transformCollection(
  data: EditorFeatureCollection,
  from: CoordSysId,
  to: CoordSysId,
): EditorFeatureCollection {
  const cloned = JSON.parse(JSON.stringify(data)) as EditorFeatureCollection

  if (from !== to) {
    for (const feature of cloned.features) {
      if (feature.geometry) {
        gcoord.transform(
          feature.geometry as Parameters<typeof gcoord.transform>[0],
          coordSysToGcoord(from),
          coordSysToGcoord(to),
        )
      }
    }
  }

  return roundCollection(cloned)
}
