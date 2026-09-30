import 'leaflet'

declare module 'leaflet' {
  namespace CRS {
    // proj4leaflet + chinatmsproviders 注入的百度 CRS（可重建以扩展缩放级别）
    let Baidu: CRS
  }

  namespace tileLayer {
    function chinaProvider(
      provider: string,
      options?: TileLayerOptions & { key?: string },
    ): TileLayer
  }
}

declare module 'leaflet.chinatmsproviders' {}
