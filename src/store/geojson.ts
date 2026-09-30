import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from 'geojson'
import {
  parseCoordSys,
  type CoordSysId,
} from '../data/coordSystems'
import { roundCollection } from './coordinates'

export type EditorFeature = Omit<
  Feature<Geometry, GeoJsonProperties>,
  'id'
> & {
  id: string
}

export type EditorFeatureCollection = Omit<
  FeatureCollection<Geometry, GeoJsonProperties>,
  'features'
> & {
  features: EditorFeature[]
  /** 扩展字段：标注数据坐标系，便于其他项目正确叠加 */
  coordSys?: CoordSysId
}

export type ParseResult =
  | { ok: true; data: EditorFeatureCollection }
  | { ok: false; error: string }

export const EMPTY_COLLECTION: EditorFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const geometryTypes = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function makeFeatureId(index: number): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  return uuid ? `feature-${uuid}` : `feature-${Date.now()}-${index}`
}

function validateGeometry(value: unknown, path: string): string | null {
  if (!isRecord(value)) {
    return `${path} 必须是一个几何对象`
  }

  if (typeof value.type !== 'string' || !geometryTypes.has(value.type)) {
    return `${path}.type 不是受支持的 GeoJSON 几何类型`
  }

  if (value.type === 'GeometryCollection') {
    if (!Array.isArray(value.geometries)) {
      return `${path}.geometries 必须是数组`
    }
    for (let index = 0; index < value.geometries.length; index += 1) {
      const error = validateGeometry(
        value.geometries[index],
        `${path}.geometries[${index}]`,
      )
      if (error) return error
    }
    return null
  }

  if (!Array.isArray(value.coordinates)) {
    return `${path}.coordinates 必须是数组`
  }

  return null
}

/**
 * 校验并规范化外部数据。编辑器内部始终使用字符串 ID，
 * 以便地图图层、JSON 文本和属性表稳定地指向同一个要素。
 */
export function validateGeoJson(value: unknown): ParseResult {
  if (!isRecord(value) || value.type !== 'FeatureCollection') {
    return { ok: false, error: '根对象的 type 必须是 FeatureCollection' }
  }

  if (!Array.isArray(value.features)) {
    return { ok: false, error: 'features 必须是数组' }
  }

  const features: EditorFeature[] = []

  for (let index = 0; index < value.features.length; index += 1) {
    const item = value.features[index]
    const path = `features[${index}]`

    if (!isRecord(item) || item.type !== 'Feature') {
      return { ok: false, error: `${path}.type 必须是 Feature` }
    }

    if (item.geometry !== null) {
      const geometryError = validateGeometry(item.geometry, `${path}.geometry`)
      if (geometryError) return { ok: false, error: geometryError }
    }

    if (
      item.properties !== null &&
      item.properties !== undefined &&
      !isRecord(item.properties)
    ) {
      return { ok: false, error: `${path}.properties 必须是对象或 null` }
    }

    features.push({
      ...(item as unknown as Feature<Geometry, GeoJsonProperties>),
      id:
        typeof item.id === 'string' || typeof item.id === 'number'
          ? String(item.id)
          : makeFeatureId(index),
      properties: (item.properties ?? {}) as GeoJsonProperties,
    })
  }

  const coordSys = parseCoordSys(value.coordSys) ?? undefined

  return {
    ok: true,
    data: {
      ...(value as unknown as FeatureCollection<Geometry, GeoJsonProperties>),
      type: 'FeatureCollection',
      features,
      ...(coordSys ? { coordSys } : {}),
    },
  }
}

export function parseGeoJsonText(text: string): ParseResult {
  try {
    return validateGeoJson(JSON.parse(text.replace(/^\uFEFF/, '')))
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知语法错误'
    return { ok: false, error: `JSON 语法错误：${message}` }
  }
}

export function stringifyGeoJson(
  data: EditorFeatureCollection,
  options: { coordSys?: CoordSysId } = {},
): string {
  // 导出前统一坐标小数位，避免地图编辑/坐标转换产生长短不一的浮点
  const payload: EditorFeatureCollection = roundCollection({ ...data })
  const coordSys = options.coordSys ?? data.coordSys
  if (coordSys) payload.coordSys = coordSys
  else delete payload.coordSys
  return JSON.stringify(payload, null, 2)
}

export function parsePropertyValue(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed === '') return ''

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

export function propertyValueToText(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value ?? '')
}

export function cloneCollection(
  data: EditorFeatureCollection,
): EditorFeatureCollection {
  return JSON.parse(JSON.stringify(data)) as EditorFeatureCollection
}

export function updateFeatureProperties(
  data: EditorFeatureCollection,
  featureId: string,
  properties: GeoJsonProperties,
): EditorFeatureCollection {
  return {
    ...data,
    features: data.features.map((feature) =>
      feature.id === featureId ? { ...feature, properties } : feature,
    ),
  }
}

export function replaceFeature(
  data: EditorFeatureCollection,
  nextFeature: EditorFeature,
): EditorFeatureCollection {
  return {
    ...data,
    features: data.features.map((feature) =>
      feature.id === nextFeature.id ? nextFeature : feature,
    ),
  }
}

export function removeFeature(
  data: EditorFeatureCollection,
  featureId: string,
): EditorFeatureCollection {
  return {
    ...data,
    features: data.features.filter((feature) => feature.id !== featureId),
  }
}

export function appendFeature(
  data: EditorFeatureCollection,
  feature: Feature<Geometry, GeoJsonProperties>,
): EditorFeatureCollection {
  const nextFeature: EditorFeature = {
    ...feature,
    id:
      feature.id === undefined
        ? makeFeatureId(data.features.length)
        : String(feature.id),
    properties: feature.properties ?? {},
  }
  return { ...data, features: [...data.features, nextFeature] }
}
