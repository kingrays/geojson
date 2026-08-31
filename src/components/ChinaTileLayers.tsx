import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import '../map/chinaMapSetup'

interface ChinaTileLayersProps {
  layers: string[]
  apiKey: string
  maxZoom?: number
  maxNativeZoom?: number
}

/** 通过 chinaProvider 动态挂载国内底图瓦片层 */
export function ChinaTileLayers({
  layers,
  apiKey,
  maxZoom = 22,
  maxNativeZoom = 18,
}: ChinaTileLayersProps) {
  const map = useMap()

  useEffect(() => {
    const tileLayers = layers.map((layerName) =>
      L.tileLayer.chinaProvider(layerName, {
        key: apiKey,
        maxNativeZoom,
        maxZoom,
      }).addTo(map),
    )

    return () => {
      tileLayers.forEach((layer) => map.removeLayer(layer))
    }
  }, [map, layers, apiKey, maxZoom, maxNativeZoom])

  return null
}
