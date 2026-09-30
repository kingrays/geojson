import { useEffect, useMemo, useRef } from 'react'
import {
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L, {
  type LeafletEvent,
  type Layer,
  type PathOptions,
} from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import { LocateFixed } from 'lucide-react'
import type { Feature, GeoJsonProperties, Geometry } from 'geojson'
import { getBasemap, shouldSuggestExportTarget } from '../data/basemaps'
import type { CoordSysId, TargetPlatform } from '../data/coordSystems'
import { getTargetPlatform } from '../data/coordSystems'
import type {
  EditorFeature,
  EditorFeatureCollection,
} from '../store/geojson'
import { transformCollection, transformFeature } from '../store/coordinates'
import { getMapKey } from '../store/mapKeys'
import { getMapCrs, getMapCrsKey } from '../map/chinaMapSetup'
import { BasemapSwitcher } from './BasemapSwitcher'
import { ChinaTileLayers } from './ChinaTileLayers'
import { TargetPlatformSwitcher } from './TargetPlatformSwitcher'

/** 超过瓦片原生级别后拉伸显示，便于精细绘制 */
const MAP_MAX_ZOOM = 22
const MAP_MIN_ZOOM = 2
const MAP_DEFAULT_ZOOM = 16
/** 适配全部要素时允许更近，避免小范围图形被压在 17 级 */
const FIT_BOUNDS_MAX_ZOOM = 20
const OSM_MAX_NATIVE_ZOOM = 19
/** 国内底图原生瓦片最高 18 级；更高缩放由 Leaflet 超采样 */
const CHINA_MAX_NATIVE_ZOOM = 18

type EditableLayer = Layer & {
  feature?: EditorFeature
  toGeoJSON?: () => Feature<Geometry, GeoJsonProperties>
}

type GeomanLayerEvent = LeafletEvent & {
  layer: EditableLayer
}

interface MapEditorProps {
  data: EditorFeatureCollection
  revision: number
  fitRequest: number
  selectedId: string | null
  dataCrs: CoordSysId
  basemapId: string
  targetPlatform: TargetPlatform
  onBasemapChange: (basemapId: string) => void
  onManageKeys: () => void
  onTargetPlatformChange: (platform: TargetPlatform) => void
  onSuggestTargetPlatform: () => void
  onFit: () => void
  onSelect: (id: string | null) => void
  onCreate: (feature: Feature<Geometry, GeoJsonProperties>) => void
  onEdit: (
    id: string,
    feature: Feature<Geometry, GeoJsonProperties>,
  ) => void
  onRemove: (id: string) => void
}

function FitController({
  data,
  fitRequest,
}: {
  data: EditorFeatureCollection
  fitRequest: number
}) {
  const map = useMap()
  const dataRef = useRef(data)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    if (dataRef.current.features.length === 0) return

    const bounds = L.geoJSON(dataRef.current).getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: FIT_BOUNDS_MAX_ZOOM })
    }
  }, [fitRequest, map])

  return null
}

function DrawingController({
  basemapId,
  basemapCrs,
  dataCrs,
  targetPlatform,
  onCreate,
  onRemove,
  onSuggestTargetPlatform,
}: {
  basemapId: string
  basemapCrs: CoordSysId
  dataCrs: CoordSysId
  targetPlatform: TargetPlatform
  onCreate: MapEditorProps['onCreate']
  onRemove: MapEditorProps['onRemove']
  onSuggestTargetPlatform: () => void
}) {
  const map = useMap()
  const hasSuggestedRef = useRef(false)

  useEffect(() => {
    map.pm.setLang('zh')
    map.pm.addControls({
      position: 'topright',
      drawMarker: true,
      drawCircleMarker: false,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    })

    // pm:create / pm:remove 会打到 map；pm:update（点「完成」）只打在图层上，见 onEachFeature
    const handleCreate = (event: GeomanLayerEvent) => {
      if (
        !hasSuggestedRef.current &&
        shouldSuggestExportTarget(basemapId, targetPlatform)
      ) {
        hasSuggestedRef.current = true
        onSuggestTargetPlatform()
      }

      const feature = event.layer.toGeoJSON?.()
      if (!feature) return

      event.layer.remove()
      onCreate(transformFeature(feature, basemapCrs, dataCrs))
    }

    const handleRemove = (event: GeomanLayerEvent) => {
      const id = event.layer.feature?.id
      if (id) onRemove(String(id))
    }

    map.on('pm:create', handleCreate)
    map.on('pm:remove', handleRemove)

    return () => {
      map.off('pm:create', handleCreate)
      map.off('pm:remove', handleRemove)
      map.pm.removeControls()
    }
  }, [
    map,
    basemapId,
    basemapCrs,
    dataCrs,
    targetPlatform,
    onCreate,
    onRemove,
    onSuggestTargetPlatform,
  ])

  return null
}

function ClearSelection({ onSelect }: Pick<MapEditorProps, 'onSelect'>) {
  useMapEvents({
    click: () => onSelect(null),
  })
  return null
}

function RecenterButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="map-recenter"
      type="button"
      title="缩放至全部要素"
      aria-label="缩放至全部要素"
      onClick={onClick}
    >
      <LocateFixed size={18} />
    </button>
  )
}

function getMapHint(
  dataCrs: CoordSysId,
  basemapCrs: CoordSysId,
  basemapLabel: string,
  targetLabel: string,
): string {
  if (dataCrs !== basemapCrs) {
    return `当前按 ${basemapLabel} 预览，导出仍为 ${targetLabel} 坐标`
  }
  return '使用右侧工具绘制、编辑或拖拽；改完后点「完成」再写入数据'
}

export function MapEditor(props: MapEditorProps) {
  const {
    data,
    revision,
    fitRequest,
    selectedId,
    dataCrs,
    basemapId,
    targetPlatform,
    onBasemapChange,
    onManageKeys,
    onTargetPlatformChange,
    onSuggestTargetPlatform,
    onFit,
    onSelect,
    onCreate,
    onEdit,
    onRemove,
  } = props

  const basemap = getBasemap(basemapId)
  const basemapCrs = basemap.basemapCrs
  const target = getTargetPlatform(targetPlatform)

  // Geoman 的 pm:update 只在图层上触发；用 ref 避免 onEachFeature 闭包过期
  const onEditRef = useRef(onEdit)
  const basemapCrsRef = useRef(basemapCrs)
  const dataCrsRef = useRef(dataCrs)
  useEffect(() => {
    onEditRef.current = onEdit
    basemapCrsRef.current = basemapCrs
    dataCrsRef.current = dataCrs
  }, [onEdit, basemapCrs, dataCrs])

  const displayData = useMemo(
    () =>
      dataCrs === basemapCrs
        ? data
        : transformCollection(data, dataCrs, basemapCrs),
    [data, dataCrs, basemapCrs],
  )

  const chinaKey = basemap.keyProvider
    ? getMapKey(basemap.keyProvider) ?? ''
    : ''

  const featureStyle = (feature?: Feature): PathOptions => ({
    color: String(feature?.id) === selectedId ? '#0f766e' : '#475569',
    weight: String(feature?.id) === selectedId ? 4 : 2,
    fillColor: String(feature?.id) === selectedId ? '#2dd4bf' : '#94a3b8',
    fillOpacity: String(feature?.id) === selectedId ? 0.6 : 0.52,
  })

  const mapHint = getMapHint(
    dataCrs,
    basemapCrs,
    basemap.label,
    target.label,
  )

  /**
   * 仅在点击工具栏「完成」退出编辑/拖拽模式时写回状态。
   * Geoman：编辑过程触发 pm:edit；有改动并 disable 时触发 pm:update。
   */
  const bindLayerEditSync = (
    feature: Feature<Geometry, GeoJsonProperties>,
    layer: Layer,
  ) => {
    const editable = layer as EditableLayer
    const syncGeometry = () => {
      const id = editable.feature?.id ?? feature.id
      const nextFeature = editable.toGeoJSON?.()
      if (id == null || !nextFeature) return
      onEditRef.current(
        String(id),
        transformFeature(
          nextFeature,
          basemapCrsRef.current,
          dataCrsRef.current,
        ),
      )
    }
    layer.on('pm:update', syncGeometry)
  }

  return (
    <section className="map-pane" aria-label="GeoJSON 地图">
      <MapContainer
        key={getMapCrsKey(basemapCrs)}
        crs={getMapCrs(basemapCrs)}
        center={[31.236, 121.482]}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className="map"
        zoomControl
      >
        {basemap.url ? (
          <TileLayer
            attribution={basemap.attribution ?? ''}
            url={basemap.url}
            maxNativeZoom={OSM_MAX_NATIVE_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
          />
        ) : (
          basemap.layers &&
          chinaKey && (
            <ChinaTileLayers
              key={`${basemapId}-${chinaKey}`}
              layers={basemap.layers}
              apiKey={chinaKey}
              maxNativeZoom={CHINA_MAX_NATIVE_ZOOM}
              maxZoom={MAP_MAX_ZOOM}
            />
          )
        )}
        <GeoJSON
          key={`${revision}-${basemapCrs}-${basemapId}`}
          data={displayData}
          style={featureStyle}
          pointToLayer={(feature, latlng) =>
            L.circleMarker(latlng, {
              ...featureStyle(feature),
              radius: String(feature.id) === selectedId ? 9 : 7,
            })
          }
          onEachFeature={(feature, layer) => {
            layer.on('click', (event) => {
              L.DomEvent.stopPropagation(event)
              onSelect(String(feature.id))
            })
            bindLayerEditSync(feature, layer)
            const name = feature.properties?.name
            if (name) layer.bindTooltip(String(name))
          }}
        />
        <FitController data={displayData} fitRequest={fitRequest} />
        <DrawingController
          basemapId={basemapId}
          basemapCrs={basemapCrs}
          dataCrs={dataCrs}
          targetPlatform={targetPlatform}
          onCreate={onCreate}
          onRemove={onRemove}
          onSuggestTargetPlatform={onSuggestTargetPlatform}
        />
        <ClearSelection onSelect={onSelect} />
      </MapContainer>
      <RecenterButton onClick={onFit} />
      <div className="map-controls">
        <TargetPlatformSwitcher
          value={targetPlatform}
          onChange={onTargetPlatformChange}
        />
        <BasemapSwitcher
          value={basemapId}
          onChange={onBasemapChange}
          onManageKeys={onManageKeys}
        />
      </div>
      <div className="map-hint">{mapHint}</div>
    </section>
  )
}
