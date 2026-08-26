import type { TargetPlatform } from './coordSystems'

export type MapKeyProvider = 'tianditu' | 'gaode' | 'baidu'

export interface BasemapDefinition {
  id: string
  label: string
  /** 底图瓦片使用的坐标系 */
  basemapCrs: 'WGS84' | 'GCJ-02' | 'BD-09'
  /** 可用的用途平台 */
  platforms: TargetPlatform[]
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
    platforms: ['international'],
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  {
    id: 'tianditu-normal',
    label: '天地图 · 矢量',
    // 天地图 _w 瓦片为 Web 墨卡托 + CGCS2000，与 WGS84 等价用于预览
    basemapCrs: 'WGS84',
    platforms: ['gcj'],
    keyProvider: 'tianditu',
    keyApplyUrl: 'https://lbs.tianditu.gov.cn/',
    layers: ['TianDiTu.Normal.Map', 'TianDiTu.Normal.Annotion'],
  },
  {
    id: 'tianditu-satellite',
    label: '天地图 · 影像',
    basemapCrs: 'WGS84',
    platforms: ['gcj'],
    keyProvider: 'tianditu',
    keyApplyUrl: 'https://lbs.tianditu.gov.cn/',
    layers: ['TianDiTu.Satellite.Map', 'TianDiTu.Satellite.Annotion'],
  },
  {
    id: 'gaode-normal',
    label: '高德 · 标准',
    basemapCrs: 'GCJ-02',
    platforms: ['gcj'],
    keyProvider: 'gaode',
    keyApplyUrl: 'https://lbs.amap.com/',
    layers: ['GaoDe.Normal.Map'],
  },
  {
    id: 'gaode-satellite',
    label: '高德 · 卫星',
    basemapCrs: 'GCJ-02',
    platforms: ['gcj'],
    keyProvider: 'gaode',
    keyApplyUrl: 'https://lbs.amap.com/',
    layers: ['GaoDe.Satellite.Map', 'GaoDe.Satellite.Annotion'],
  },
  {
    id: 'baidu-normal',
    label: '百度 · 标准',
    basemapCrs: 'BD-09',
    platforms: ['baidu'],
    keyProvider: 'baidu',
    keyApplyUrl: 'https://lbsyun.baidu.com/',
    layers: ['Baidu.Normal.Map'],
  },
  {
    id: 'baidu-satellite',
    label: '百度 · 卫星',
    basemapCrs: 'BD-09',
    platforms: ['baidu'],
    keyProvider: 'baidu',
    keyApplyUrl: 'https://lbsyun.baidu.com/',
    layers: ['Baidu.Satellite.Map', 'Baidu.Satellite.Annotion'],
  },
]

export const DEFAULT_BASEMAP_ID = 'osm'

export function getBasemap(id: string): BasemapDefinition {
  return BASEMAPS.find((item) => item.id === id) ?? BASEMAPS[0]
}

export function getBasemapsForPlatform(platform: TargetPlatform): BasemapDefinition[] {
  return BASEMAPS.filter((item) => item.platforms.includes(platform))
}

export function isBasemapAllowedForPlatform(
  basemapId: string,
  platform: TargetPlatform,
): boolean {
  return getBasemap(basemapId).platforms.includes(platform)
}

export function isDomesticBasemap(basemapId: string): boolean {
  return getBasemap(basemapId).keyProvider !== undefined
}

export const MAP_KEY_PROVIDER_LABELS: Record<MapKeyProvider, string> = {
  tianditu: '天地图',
  gaode: '高德',
  baidu: '百度',
}

/** 用途平台对应的 Key 提供方（用于管理 Key 弹窗过滤） */
export function getKeyProvidersForPlatform(
  platform: TargetPlatform,
): MapKeyProvider[] {
  switch (platform) {
    case 'gcj':
      return ['tianditu', 'gaode']
    case 'baidu':
      return ['baidu']
    default:
      return ['tianditu', 'gaode', 'baidu']
  }
}
