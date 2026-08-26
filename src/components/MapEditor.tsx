import { useEffect, useRef } from 'react'
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
import type {
  EditorFeature,
  EditorFeatureCollection,
} from '../store/geojson'

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
}: Pick<MapEditorProps, 'data' | 'fitRequest'>) {
  const map = useMap()
  const dataRef = useRef(data)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    if (dataRef.current.features.length === 0) return

    const bounds = L.geoJSON(dataRef.current).getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 17 })
    }
  }, [fitRequest, map])

  return null
}

function DrawingController({
  onCreate,
  onEdit,
  onRemove,
}: Pick<MapEditorProps, 'onCreate' | 'onEdit' | 'onRemove'>) {
  const map = useMap()

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

    const handleCreate = (event: GeomanLayerEvent) => {
      const feature = event.layer.toGeoJSON?.()
      if (!feature) return

      // 新建图层交给 React 状态重新渲染，避免 Leaflet 内部保留重复图层。
      event.layer.remove()
      onCreate(feature)
    }

    const handleEdit = (event: GeomanLayerEvent) => {
      const id = event.layer.feature?.id
      const feature = event.layer.toGeoJSON?.()
      if (id && feature) onEdit(String(id), feature)
    }

    const handleRemove = (event: GeomanLayerEvent) => {
      const id = event.layer.feature?.id
      if (id) onRemove(String(id))
    }

    map.on('pm:create', handleCreate)
    map.on('pm:edit', handleEdit)
    map.on('pm:remove', handleRemove)

    return () => {
      map.off('pm:create', handleCreate)
      map.off('pm:edit', handleEdit)
      map.off('pm:remove', handleRemove)
      map.pm.removeControls()
    }
  }, [map, onCreate, onEdit, onRemove])

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

export function MapEditor(props: MapEditorProps) {
  const {
    data,
    revision,
    fitRequest,
    selectedId,
    onFit,
    onSelect,
    onCreate,
    onEdit,
    onRemove,
  } = props

  const featureStyle = (feature?: Feature): PathOptions => ({
    color: String(feature?.id) === selectedId ? '#0f766e' : '#475569',
    weight: String(feature?.id) === selectedId ? 4 : 2,
    fillColor: String(feature?.id) === selectedId ? '#2dd4bf' : '#94a3b8',
    fillOpacity: String(feature?.id) === selectedId ? 0.6 : 0.52,
  })

  return (
    <section className="map-pane" aria-label="GeoJSON 地图">
      <MapContainer
        center={[31.236, 121.482]}
        zoom={15}
        minZoom={2}
        className="map"
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={revision}
          data={data}
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
            const name = feature.properties?.name
            if (name) layer.bindTooltip(String(name))
          }}
        />
        <FitController data={data} fitRequest={fitRequest} />
        <DrawingController
          onCreate={onCreate}
          onEdit={onEdit}
          onRemove={onRemove}
        />
        <ClearSelection onSelect={onSelect} />
      </MapContainer>
      <RecenterButton onClick={onFit} />
      <div className="map-hint">
        使用右侧工具绘制、拖动、编辑或删除要素
      </div>
    </section>
  )
}
