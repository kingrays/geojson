import { describe, expect, it } from 'vitest'
import {
  EMPTY_COLLECTION,
  appendFeature,
  parseGeoJsonText,
  parsePropertyValue,
  removeFeature,
  stringifyGeoJson,
  updateFeatureProperties,
} from './geojson'

describe('GeoJSON 解析与校验', () => {
  it('解析 FeatureCollection，并为缺少 ID 的要素补充字符串 ID', () => {
    const result = parseGeoJsonText(`{
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "properties": {"name": "中文名称"},
        "geometry": {"type": "Point", "coordinates": [121, 31]}
      }]
    }`)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.features[0].id).toMatch(/^feature-/)
    expect(result.data.features[0].properties?.name).toBe('中文名称')
  })

  it('兼容 UTF-8 BOM，并把数字 ID 规范化为字符串', () => {
    const result = parseGeoJsonText(
      '\uFEFF{"type":"FeatureCollection","features":[{"type":"Feature","id":7,"properties":{},"geometry":null}]}',
    )

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.features[0].id).toBe('7')
  })

  it('解析 coordSys 扩展字段并在导出时写入', () => {
    const parsed = parseGeoJsonText(`{
      "type": "FeatureCollection",
      "coordSys": "GCJ-02",
      "features": []
    }`)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.coordSys).toBe('GCJ-02')

    const exported = stringifyGeoJson(parsed.data, { coordSys: 'GCJ-02' })
    expect(JSON.parse(exported).coordSys).toBe('GCJ-02')
  })

  it('导出时统一经纬度小数位为最多 6 位', () => {
    const exported = stringifyGeoJson({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'p1',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [121.53779775852013, 29.83242362981096],
          },
        },
      ],
    })
    expect(JSON.parse(exported).features[0].geometry.coordinates).toEqual([
      121.537798, 29.832424,
    ])
  })

  it('拒绝错误的根类型和几何结构', () => {
    expect(parseGeoJsonText('{"type":"Point","coordinates":[0,0]}')).toEqual({
      ok: false,
      error: '根对象的 type 必须是 FeatureCollection',
    })

    const invalidGeometry = parseGeoJsonText(
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon"}}]}',
    )
    expect(invalidGeometry.ok).toBe(false)
    if (!invalidGeometry.ok) {
      expect(invalidGeometry.error).toContain('coordinates 必须是数组')
    }
  })
})

describe('要素状态转换', () => {
  it('追加、修改属性并删除要素时不改变原集合', () => {
    const appended = appendFeature(EMPTY_COLLECTION, {
      type: 'Feature',
      properties: { name: '入口' },
      geometry: { type: 'Point', coordinates: [120, 30] },
    })
    const id = appended.features[0].id
    const updated = updateFeatureProperties(appended, id, {
      name: '主入口',
    })
    const removed = removeFeature(updated, id)

    expect(EMPTY_COLLECTION.features).toHaveLength(0)
    expect(appended.features[0].properties?.name).toBe('入口')
    expect(updated.features[0].properties?.name).toBe('主入口')
    expect(removed.features).toHaveLength(0)
  })

  it('把属性表文本转换为常用 JSON 标量', () => {
    expect(parsePropertyValue('12')).toBe(12)
    expect(parsePropertyValue('true')).toBe(true)
    expect(parsePropertyValue('{"level":2}')).toEqual({ level: 2 })
    expect(parsePropertyValue('普通文本')).toBe('普通文本')
  })
})
