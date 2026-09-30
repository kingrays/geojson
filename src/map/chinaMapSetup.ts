import L from 'leaflet'
import 'proj4'
import 'proj4leaflet'
import 'leaflet.chinatmsproviders'
import type { CoordSysId } from '../data/coordSystems'

/**
 * leaflet.chinatmsproviders 默认百度瓦片域名（online*.map.bdimg.com）在 HTTPS 下 SSL 失败。
 * GitHub Pages 等强制 HTTPS 环境需改用支持 TLS 的 maponline*.bdimg.com。
 */
const BAIDU_HTTPS_PROVIDERS = {
  Normal: {
    Map: 'https://maponline{s}.bdimg.com/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1&from=jsapi2_0',
  },
  Satellite: {
    Map: 'https://maponline{s}.bdimg.com/starpic/?qt=satepc&u=x={x};y={y};z={z};v=009;type=sate&fm=46',
    Annotion:
      'https://maponline{s}.bdimg.com/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=sl&scaler=1&p=1&from=jsapi2_0',
  },
  Subdomains: '0123',
  tms: true,
} as const

const chinaProviders = (
  L.TileLayer as unknown as {
    ChinaProvider: { providers: { Baidu: typeof BAIDU_HTTPS_PROVIDERS } }
  }
).ChinaProvider.providers
chinaProviders.Baidu = { ...BAIDU_HTTPS_PROVIDERS }

/** 与 MapEditor MAP_MAX_ZOOM 对齐；原生瓦片仍到 18，更高等级靠超采样 */
const BAIDU_CRS_MAX_ZOOM = 22

/** 按百度官方公式生成 resolutions：zoom z → 2^(18-z) */
function buildBaiduResolutions(maxZoom: number): number[] {
  const resolutions: number[] = []
  for (let zoom = 0; zoom <= maxZoom; zoom += 1) {
    resolutions[zoom] = 2 ** (18 - zoom)
  }
  return resolutions
}

/**
 * chinatmsproviders 默认百度 CRS 仅到 18 级，这里重建以支持更高缩放。
 * 瓦片 maxNativeZoom 仍为 18，19–22 由 Leaflet 拉伸显示。
 */
const leafletWithProj = L as typeof L & {
  Proj?: {
    CRS: new (
      code: string,
      def: string,
      options: {
        resolutions: number[]
        origin: [number, number]
        bounds: L.Bounds
      },
    ) => L.CRS
  }
}

if (leafletWithProj.Proj) {
  L.CRS.Baidu = new leafletWithProj.Proj.CRS(
    'EPSG:900913',
    '+proj=merc +a=6378206 +b=6356584.314245179 +lat_ts=0.0 +lon_0=0.0 +x_0=0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs',
    {
      resolutions: buildBaiduResolutions(BAIDU_CRS_MAX_ZOOM),
      origin: [0, 0],
      bounds: L.bounds([20037508.342789244, 0], [0, 20037508.342789244]),
    },
  )
}

/** 百度底图需专用 CRS（proj4leaflet），其他底图使用 Web Mercator */
export function getMapCrs(basemapCrs: CoordSysId): L.CRS {
  if (basemapCrs === 'BD-09' && L.CRS.Baidu) {
    return L.CRS.Baidu
  }
  return L.CRS.EPSG3857
}

/** MapContainer remount 键：WGS84 / GCJ-02 共用 EPSG3857，切换时不重建地图 */
export function getMapCrsKey(basemapCrs: CoordSysId): string {
  return basemapCrs === 'BD-09' ? 'BD-09' : 'EPSG3857'
}
