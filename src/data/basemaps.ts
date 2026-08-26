import {
  getTargetPlatform,
  type TargetPlatform,
} from './coordSystems'

export type MapKeyProvider = 'tianditu' | 'gaode' | 'baidu'

export interface BasemapDefinition {
  id: string
  label: string
  /** Leaflet 预览/绘制用的坐标系（与导出坐标系可以不同） */
  basemapCrs: 'WGS84' | 'GCJ-02' | 'BD-09'
  /** 该底图对应的导出目标（用于建议切换） */
  preferredExportTarget: TargetPlatform
  /** 需要 API Key 的平台；OSM 无需 Key */
  keyProvider?: MapKeyProvider
  keyApplyUrl?: string
  /** leaflet.chinatmsproviders 图层名；OSM 使用 react-leaflet TileLayer */
  layers?: string[]
  attribution?: string
  url?: string
}

export const BASEMAPS: BasemapDefinition[] = [
  {
    id: 'osm',
    label: 'OpenStreetMap',
    basemapCrs: 'WGS84',
    preferredExportTarget: 'international',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  {
    id: 'tianditu-normal',
    label: '天地图 · 矢量',
    // 天地图 _w 瓦片为 Web 墨卡托 + CGCS2000，与 WGS84 等价用于预览
    basemapCrs: 'WGS84',
    preferredExportTarget: 'tianditu',
    keyProvider: 'tianditu',
    keyApplyUrl: 'https://lbs.tianditu.gov.cn/',
    layers: ['TianDiTu.Normal.Map', 'TianDiTu.Normal.Annotion'],
  },
  {
    id: 'tianditu-satellite',
    label: '天地图 · 影像',
    basemapCrs: 'WGS84',
    preferredExportTarget: 'tianditu',
    keyProvider: 'tianditu',
    keyApplyUrl: 'https://lbs.tianditu.gov.cn/',
    layers: ['TianDiTu.Satellite.Map', 'TianDiTu.Satellite.Annotion'],
  },
  {
    id: 'gaode-normal',
    label: '高德 · 标准',
    // 高德 XYZ 瓦片按 GCJ-02 经纬度套 Web 墨卡托切网，叠加层须用 GCJ-02
    basemapCrs: 'GCJ-02',
    preferredExportTarget: 'gaode',
    keyProvider: 'gaode',
    keyApplyUrl: 'https://lbs.amap.com/',
    layers: ['GaoDe.Normal.Map'],
  },
  {
    id: 'gaode-satellite',
    label: '高德 · 卫星',
    basemapCrs: 'GCJ-02',
    preferredExportTarget: 'gaode',
    keyProvider: 'gaode',
    keyApplyUrl: 'https://lbs.amap.com/',
    layers: ['GaoDe.Satellite.Map', 'GaoDe.Satellite.Annotion'],
  },
  {
    id: 'baidu-normal',
    label: '百度 · 标准',
    basemapCrs: 'BD-09',
    preferredExportTarget: 'baidu',
    keyProvider: 'baidu',
    keyApplyUrl: 'https://lbsyun.baidu.com/',
    layers: ['Baidu.Normal.Map'],
  },
  {
    id: 'baidu-satellite',
    label: '百度 · 卫星',
    basemapCrs: 'BD-09',
    preferredExportTarget: 'baidu',
    keyProvider: 'baidu',
    keyApplyUrl: 'https://lbsyun.baidu.com/',
    layers: ['Baidu.Satellite.Map', 'Baidu.Satellite.Annotion'],
  },
]

export const DEFAULT_BASEMAP_ID = 'osm'

export function getBasemap(id: string): BasemapDefinition {
  return BASEMAPS.find((item) => item.id === id) ?? BASEMAPS[0]
}

export function getAllBasemaps(): BasemapDefinition[] {
  return BASEMAPS
}

export function isDomesticBasemap(basemapId: string): boolean {
  return getBasemap(basemapId).keyProvider !== undefined
}

export function getPreferredExportTarget(basemapId: string): TargetPlatform {
  return getBasemap(basemapId).preferredExportTarget
}

/** 底图对应导出目标的坐标系与当前导出目标不同时，建议切换 */
export function shouldSuggestExportTarget(
  basemapId: string,
  current: TargetPlatform,
): boolean {
  const preferred = getPreferredExportTarget(basemapId)
  if (preferred === current) return false
  return (
    getTargetPlatform(preferred).coordSys !==
    getTargetPlatform(current).coordSys
  )
}

export const MAP_KEY_PROVIDER_LABELS: Record<MapKeyProvider, string> = {
  tianditu: '天地图',
  gaode: '高德',
  baidu: '百度',
}

export const ALL_KEY_PROVIDERS: MapKeyProvider[] = [
  'tianditu',
  'gaode',
  'baidu',
]
