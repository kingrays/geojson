import L from 'leaflet'
import 'proj4'
import 'proj4leaflet'
import 'leaflet.chinatmsproviders'
import type { CoordSysId } from '../data/coordSystems'

/** 百度底图需专用 CRS（proj4leaflet），其他底图使用 Web Mercator */
export function getMapCrs(basemapCrs: CoordSysId): L.CRS {
  if (basemapCrs === 'BD-09' && L.CRS.Baidu) {
    return L.CRS.Baidu
  }
  return L.CRS.EPSG3857
}
