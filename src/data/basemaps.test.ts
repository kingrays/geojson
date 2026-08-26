import { describe, expect, it } from 'vitest'
import { getBasemap } from './basemaps'

describe('basemaps', () => {
  it('天地图 _w 瓦片预览坐标系为 WGS84', () => {
    expect(getBasemap('tianditu-normal').basemapCrs).toBe('WGS84')
    expect(getBasemap('tianditu-satellite').basemapCrs).toBe('WGS84')
  })

  it('高德底图预览坐标系为 GCJ-02', () => {
    expect(getBasemap('gaode-normal').basemapCrs).toBe('GCJ-02')
  })
})
