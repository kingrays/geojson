import { describe, expect, it } from 'vitest'
import {
  getAllBasemaps,
  getBasemap,
  getPreferredExportTarget,
  shouldSuggestExportTarget,
} from './basemaps'

describe('basemaps', () => {
  it('天地图预览为 WGS84，高德预览为 GCJ-02', () => {
    expect(getBasemap('tianditu-normal').basemapCrs).toBe('WGS84')
    expect(getBasemap('tianditu-satellite').basemapCrs).toBe('WGS84')
    expect(getBasemap('gaode-normal').basemapCrs).toBe('GCJ-02')
    expect(getBasemap('gaode-satellite').basemapCrs).toBe('GCJ-02')
  })

  it('百度底图预览坐标系为 BD-09', () => {
    expect(getBasemap('baidu-normal').basemapCrs).toBe('BD-09')
  })

  it('底图列表不按导出目标过滤', () => {
    expect(getAllBasemaps().map((item) => item.id)).toEqual([
      'osm',
      'tianditu-normal',
      'tianditu-satellite',
      'gaode-normal',
      'gaode-satellite',
      'baidu-normal',
      'baidu-satellite',
    ])
  })

  it('天地图底图叠加国际标准导出时不建议切换', () => {
    expect(getPreferredExportTarget('tianditu-normal')).toBe('tianditu')
    expect(shouldSuggestExportTarget('tianditu-normal', 'international')).toBe(
      false,
    )
  })

  it('高德底图叠加 WGS84 导出时建议切换到高德', () => {
    expect(shouldSuggestExportTarget('gaode-normal', 'international')).toBe(true)
    expect(shouldSuggestExportTarget('gaode-normal', 'tianditu')).toBe(true)
    expect(shouldSuggestExportTarget('gaode-normal', 'gaode')).toBe(false)
  })
})
