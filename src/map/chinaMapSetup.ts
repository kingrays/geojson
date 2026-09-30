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
