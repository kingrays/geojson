import { useMemo, useState } from 'react'
import { Plus, Table2, Trash2, X } from 'lucide-react'
import type { EditorFeatureCollection } from '../store/geojson'
import {
  parsePropertyValue,
  propertyValueToText,
} from '../store/geojson'

interface PropertyTableProps {
  data: EditorFeatureCollection
  selectedId: string | null
  onSelect: (id: string) => void
  onChangeProperty: (id: string, key: string, value: unknown) => void
  onAddProperty: (key: string) => void
  onRemoveProperty: (key: string) => void
  onRemoveFeature: (id: string) => void
}

export function PropertyTable({
  data,
  selectedId,
  onSelect,
  onChangeProperty,
  onAddProperty,
  onRemoveProperty,
  onRemoveFeature,
}: PropertyTableProps) {
  const [newProperty, setNewProperty] = useState('')

  const propertyKeys = useMemo(
    () =>
      Array.from(
        new Set(
          data.features.flatMap((feature) =>
            Object.keys(feature.properties ?? {}),
          ),
        ),
      ).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    [data],
  )

  const submitProperty = () => {
    const key = newProperty.trim()
    if (!key || propertyKeys.includes(key)) return
    onAddProperty(key)
    setNewProperty('')
  }

  return (
    <div className="property-panel">
      <div className="panel-toolbar property-toolbar">
        <span className="panel-toolbar-title">
          <Table2 size={16} />
          {data.features.length} 个要素
        </span>
        <div className="add-property">
          <input
            value={newProperty}
            placeholder="新属性名"
            aria-label="新属性名"
            onChange={(event) => setNewProperty(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitProperty()
            }}
          />
          <button
            className="button button-subtle"
            type="button"
            onClick={submitProperty}
            disabled={!newProperty.trim()}
          >
            <Plus size={15} />
            添加属性
          </button>
        </div>
      </div>

      {data.features.length === 0 ? (
        <div className="empty-state">
          <Table2 size={36} />
          <strong>暂无要素</strong>
          <span>请在地图上绘制，或打开 GeoJSON 文件。</span>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="index-column">#</th>
                <th>几何类型</th>
                {propertyKeys.map((key) => (
                  <th key={key}>
                    <span className="property-heading">
                      {key}
                      <button
                        type="button"
                        title={`删除属性 ${key}`}
                        aria-label={`删除属性 ${key}`}
                        onClick={() => onRemoveProperty(key)}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  </th>
                ))}
                <th className="actions-column">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.features.map((feature, index) => (
                <tr
                  key={feature.id}
                  className={feature.id === selectedId ? 'is-selected' : ''}
                  onClick={() => onSelect(feature.id)}
                >
                  <td className="index-column">{index + 1}</td>
                  <td>
                    <span className="geometry-badge">
                      {feature.geometry?.type ?? 'Null'}
                    </span>
                  </td>
                  {propertyKeys.map((key) => (
                    <td key={key}>
                      <input
                        value={propertyValueToText(feature.properties?.[key])}
                        aria-label={`${feature.id} 的 ${key}`}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          onChangeProperty(
                            feature.id,
                            key,
                            parsePropertyValue(event.target.value),
                          )
                        }
                      />
                    </td>
                  ))}
                  <td className="actions-column">
                    <button
                      className="icon-button danger"
                      type="button"
                      title="删除要素"
                      aria-label={`删除要素 ${index + 1}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onRemoveFeature(feature.id)
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
