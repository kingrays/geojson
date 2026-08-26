import gcoord from 'gcoord'

/** 用途平台：决定数据存储与导出的坐标系 */
export type TargetPlatform = 'gcj' | 'baidu' | 'international'

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
    id: 'gcj',
    label: '天地图 / 高德',
    coordSys: 'GCJ-02',
    statusLabel: '天地图/高德坐标 · GCJ-02',
    defaultBasemapId: 'tianditu-normal',
    confirmMessage:
      '将把全部要素坐标转换为天地图/高德坐标（GCJ-02），导出后可直接叠加到对应地图。是否继续？',
  },
  {
    id: 'baidu',
    label: '百度',
    coordSys: 'BD-09',
    statusLabel: '百度坐标 · BD-09',
    defaultBasemapId: 'baidu-normal',
    confirmMessage:
      '将把全部要素坐标转换为百度坐标（BD-09），导出后可直接叠加到百度地图。是否继续？',
  },
  {
    id: 'international',
    label: '国际标准',
    coordSys: 'WGS84',
    statusLabel: 'WGS 84 · EPSG:4326',
    defaultBasemapId: 'osm',
    confirmMessage:
      '将把全部要素坐标转换为国际标准坐标（WGS84），导出后可用于 OSM 等国际地图。是否继续？',
  },
]

export const COORD_SYS_VALUES: CoordSysId[] = ['WGS84', 'GCJ-02', 'BD-09']

export function getTargetPlatform(id: TargetPlatform): TargetPlatformDefinition {
  return (
    TARGET_PLATFORMS.find((item) => item.id === id) ?? TARGET_PLATFORMS[2]
  )
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
): TargetPlatform {
  switch (coordSys) {
    case 'GCJ-02':
      return 'gcj'
    case 'BD-09':
      return 'baidu'
    default:
      return 'international'
  }
}
