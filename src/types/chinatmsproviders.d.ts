import 'leaflet'

declare module 'leaflet' {
  namespace CRS {
    // proj4leaflet + chinatmsproviders 注入的百度 CRS
    const Baidu: CRS
  }

  namespace tileLayer {
    function chinaProvider(
      provider: string,
      options?: TileLayerOptions & { key?: string },
    ): TileLayer
  }
}

declare module 'leaflet.chinatmsproviders' {}
