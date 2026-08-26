import { describe, expect, it } from 'vitest'
import {
  coordSysToTargetPlatform,
  getTargetPlatform,
  parseTargetPlatform,
} from './coordSystems'

describe('导出目标', () => {
  it('旧版 gcj 解析为高德', () => {
    expect(parseTargetPlatform('gcj')).toBe('gaode')
    expect(parseTargetPlatform('gaode')).toBe('gaode')
    expect(parseTargetPlatform('tianditu')).toBe('tianditu')
    expect(parseTargetPlatform('unknown')).toBeNull()
  })

  it('高德导出 GCJ-02，天地图与国际标准导出 WGS84', () => {
    expect(getTargetPlatform('gaode').coordSys).toBe('GCJ-02')
    expect(getTargetPlatform('baidu').coordSys).toBe('BD-09')
    expect(getTargetPlatform('tianditu').coordSys).toBe('WGS84')
    expect(getTargetPlatform('international').coordSys).toBe('WGS84')
  })

  it('按文件坐标系推断导出目标，WGS84 时保留当前天地图', () => {
    expect(coordSysToTargetPlatform('GCJ-02')).toBe('gaode')
    expect(coordSysToTargetPlatform('BD-09')).toBe('baidu')
    expect(coordSysToTargetPlatform('WGS84')).toBe('international')
    expect(coordSysToTargetPlatform('WGS84', 'tianditu')).toBe('tianditu')
  })
})
