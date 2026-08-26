import gcoord from 'gcoord'
import type { Feature, GeoJsonProperties, Geometry } from 'geojson'
import {
  coordSysToGcoord,
  type CoordSysId,
} from '../data/coordSystems'
import type { EditorFeatureCollection } from './geojson'

/** 同坐标系时跳过转换 */
export function transformCoordinate(
  lng: number,
  lat: number,
  from: CoordSysId,
  to: CoordSysId,
): [number, number] {
  if (from === to) return [lng, lat]
  return gcoord.transform(
    [lng, lat],
    coordSysToGcoord(from),
    coordSysToGcoord(to),
  ) as [number, number]
}

/** 深拷贝后转换 Feature 几何坐标 */
export function transformFeature<G extends Geometry>(
  feature: Feature<G, GeoJsonProperties>,
  from: CoordSysId,
  to: CoordSysId,
): Feature<G, GeoJsonProperties> {
  if (from === to) {
    return JSON.parse(JSON.stringify(feature)) as Feature<G, GeoJsonProperties>
  }

  const cloned = JSON.parse(JSON.stringify(feature)) as Feature<
    G,
    GeoJsonProperties
  >
  if (cloned.geometry) {
    gcoord.transform(
      cloned.geometry as Parameters<typeof gcoord.transform>[0],
      coordSysToGcoord(from),
      coordSysToGcoord(to),
    )
  }
  return cloned
}

/** 深拷贝后转换整个 FeatureCollection */
export function transformCollection(
  data: EditorFeatureCollection,
  from: CoordSysId,
  to: CoordSysId,
): EditorFeatureCollection {
  if (from === to) return JSON.parse(JSON.stringify(data))

  const cloned = JSON.parse(JSON.stringify(data)) as EditorFeatureCollection
  for (const feature of cloned.features) {
    if (feature.geometry) {
      gcoord.transform(
        feature.geometry as Parameters<typeof gcoord.transform>[0],
        coordSysToGcoord(from),
        coordSysToGcoord(to),
      )
    }
  }
  return cloned
}
