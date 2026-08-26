import gcoord from 'gcoord'

/** 导出目标：界面用产品名，内部决定存储与导出的坐标系 */
export type TargetPlatform = 'gaode' | 'baidu' | 'tianditu' | 'international'

/** 数据/底图坐标系标识 */
export type CoordSysId = 'WGS84' | 'GCJ-02' | 'BD-09'

export interface TargetPlatformDefinition {
  id: TargetPlatform
  label: string
  coordSys: CoordSysId
  statusLabel: string
  defaultBasemapId: string
  confirmMessage: string
}

export const TARGET_PLATFORMS: TargetPlatformDefinition[] = [
  {
    id: 'gaode',
    label: '高德',
    coordSys: 'GCJ-02',
    statusLabel: '导出给高德',
    defaultBasemapId: 'gaode-normal',
    confirmMessage:
      '将把全部要素转换成高德可直接叠加的坐标。是否继续？',
  },
  {
    id: 'baidu',
    label: '百度',
    coordSys: 'BD-09',
    statusLabel: '导出给百度',
    defaultBasemapId: 'baidu-normal',
    confirmMessage:
      '将把全部要素转换成百度可直接叠加的坐标。是否继续？',
  },
  {
    id: 'tianditu',
    label: '天地图',
    coordSys: 'WGS84',
    statusLabel: '导出给天地图',
    defaultBasemapId: 'tianditu-normal',
    confirmMessage:
      '将把全部要素转换成天地图可直接叠加的坐标。是否继续？',
  },
  {
    id: 'international',
    label: '国际标准',
    coordSys: 'WGS84',
    statusLabel: '导出给国际标准',
    defaultBasemapId: 'osm',
    confirmMessage:
      '将把全部要素转换成国际标准可直接叠加的坐标。是否继续？',
  },
]

export const COORD_SYS_VALUES: CoordSysId[] = ['WGS84', 'GCJ-02', 'BD-09']

export function getTargetPlatform(id: TargetPlatform): TargetPlatformDefinition {
  return (
    TARGET_PLATFORMS.find((item) => item.id === id) ??
    TARGET_PLATFORMS[TARGET_PLATFORMS.length - 1]
  )
}

/** 解析导出目标；旧版 gcj（天地图/高德）按 GCJ-02 迁到高德 */
export function parseTargetPlatform(value: unknown): TargetPlatform | null {
  if (value === 'gcj' || value === 'gaode') return 'gaode'
  if (value === 'baidu' || value === 'tianditu' || value === 'international') {
    return value
  }
  return null
}

export function coordSysToGcoord(coordSys: CoordSysId) {
  switch (coordSys) {
    case 'GCJ-02':
      return gcoord.GCJ02
    case 'BD-09':
      return gcoord.BD09
    default:
      return gcoord.WGS84
  }
}

export function parseCoordSys(value: unknown): CoordSysId | null {
  if (typeof value !== 'string') return null
  return COORD_SYS_VALUES.includes(value as CoordSysId)
    ? (value as CoordSysId)
    : null
}

export function coordSysToTargetPlatform(
  coordSys: CoordSysId,
  current?: TargetPlatform,
): TargetPlatform {
  switch (coordSys) {
    case 'GCJ-02':
      return 'gaode'
    case 'BD-09':
      return 'baidu'
    default:
      return current === 'tianditu' ? 'tianditu' : 'international'
  }
}
