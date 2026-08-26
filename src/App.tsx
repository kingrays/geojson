import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Braces, Table2, X } from 'lucide-react'
import type { Feature, GeoJsonProperties, Geometry } from 'geojson'
import { AppHeader } from './components/AppHeader'
import { sampleGeoJson } from './data/sampleGeojson'
import {
  EMPTY_COLLECTION,
  appendFeature,
  cloneCollection,
  parseGeoJsonText,
  removeFeature,
  replaceFeature,
  stringifyGeoJson,
  updateFeatureProperties,
  type EditorFeature,
  type EditorFeatureCollection,
} from './store/geojson'
import './App.css'

const MapEditor = lazy(() =>
  import('./components/MapEditor').then((module) => ({
    default: module.MapEditor,
  })),
)
const JsonEditor = lazy(() =>
  import('./components/JsonEditor').then((module) => ({
    default: module.JsonEditor,
  })),
)
const PropertyTable = lazy(() =>
  import('./components/PropertyTable').then((module) => ({
    default: module.PropertyTable,
  })),
)

const DRAFT_KEY = 'geojson-studio-draft-v1'

interface StoredDraft {
  data: EditorFeatureCollection
  fileName: string
}

function getInitialDocument(): StoredDraft {
  try {
    const rawDraft = localStorage.getItem(DRAFT_KEY)
    if (rawDraft) {
      const draft = JSON.parse(rawDraft) as Partial<StoredDraft>
      const result = parseGeoJsonText(JSON.stringify(draft.data))
      if (result.ok) {
        return {
          data: result.data,
          fileName: draft.fileName || '已恢复草稿.geojson',
        }
      }
    }
  } catch {
    // 草稿损坏或浏览器禁用存储时，退回内置示例。
  }

  return {
    data: cloneCollection(sampleGeoJson),
    fileName: '示例园区.geojson',
  }
}

function App() {
  const [initialDocument] = useState(getInitialDocument)
  const [data, setData] = useState(initialDocument.data)
  const [text, setText] = useState(() => stringifyGeoJson(initialDocument.data))
  const [fileName, setFileName] = useState(initialDocument.fileName)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'json' | 'table'>('json')
  const [revision, setRevision] = useState(0)
  const [fitRequest, setFitRequest] = useState(1)
  const [isDirty, setIsDirty] = useState(false)
  const [notice, setNotice] = useState<string | null>('已加载可编辑的示例数据')

  const commitCollection = useCallback(
    (
      nextData: EditorFeatureCollection,
      options: { fit?: boolean; dirty?: boolean } = {},
    ) => {
      setData(nextData)
      setText(stringifyGeoJson(nextData))
      setError(null)
      setRevision((value) => value + 1)
      setIsDirty(options.dirty ?? true)
      if (options.fit) setFitRequest((value) => value + 1)
      setSelectedId((current) =>
        nextData.features.some((feature) => feature.id === current)
          ? current
          : null,
      )
    },
    [],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const draft: StoredDraft = { data, fileName }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      } catch {
        // 存储空间不足或隐私模式禁用存储时，不影响当前编辑。
      }
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [data, fileName])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const handleTextChange = useCallback((nextText: string) => {
    setText(nextText)
    setIsDirty(true)
    const result = parseGeoJsonText(nextText)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setError(null)
    setData(result.data)
    setRevision((value) => value + 1)
    setSelectedId((current) =>
      result.data.features.some((feature) => feature.id === current)
        ? current
        : null,
    )
  }, [])

  const handleCreate = useCallback(
    (feature: Feature<Geometry, GeoJsonProperties>) => {
      const nextData = appendFeature(data, feature)
      commitCollection(nextData)
      setSelectedId(nextData.features.at(-1)?.id ?? null)
      setNotice('已创建要素')
    },
    [commitCollection, data],
  )

  const handleEdit = useCallback(
    (id: string, feature: Feature<Geometry, GeoJsonProperties>) => {
      const current = data.features.find((item) => item.id === id)
      if (!current) return

      const nextFeature: EditorFeature = {
        ...feature,
        id,
        properties: current.properties ?? {},
      }
      commitCollection(replaceFeature(data, nextFeature))
    },
    [commitCollection, data],
  )

  const handleRemove = useCallback(
    (id: string) => {
      commitCollection(removeFeature(data, id))
      setNotice('已删除要素')
    },
    [commitCollection, data],
  )

  const handleChangeProperty = useCallback(
    (id: string, key: string, value: unknown) => {
      const feature = data.features.find((item) => item.id === id)
      if (!feature) return
      commitCollection(
        updateFeatureProperties(data, id, {
          ...(feature.properties ?? {}),
          [key]: value,
        }),
      )
    },
    [commitCollection, data],
  )

  const handleAddProperty = useCallback(
    (key: string) => {
      const nextData: EditorFeatureCollection = {
        ...data,
        features: data.features.map((feature) => ({
          ...feature,
          properties: { ...(feature.properties ?? {}), [key]: '' },
        })),
      }
      commitCollection(nextData)
    },
    [commitCollection, data],
  )

  const handleRemoveProperty = useCallback(
    (key: string) => {
      const nextData: EditorFeatureCollection = {
        ...data,
        features: data.features.map((feature) => {
          const properties = { ...(feature.properties ?? {}) }
          delete properties[key]
          return { ...feature, properties }
        }),
      }
      commitCollection(nextData)
    },
    [commitCollection, data],
  )

  const handleNew = useCallback(() => {
    commitCollection(cloneCollection(EMPTY_COLLECTION), {
      fit: true,
      dirty: false,
    })
    setFileName('未命名.geojson')
    setActiveTab('json')
    setNotice('已新建空白文档')
  }, [commitCollection])

  const handleOpen = useCallback(
    async (file: File) => {
      const fileText = await file.text()
      const result = parseGeoJsonText(fileText)
      setFileName(file.name)
      setText(fileText.replace(/^\uFEFF/, ''))
      setActiveTab('json')

      if (!result.ok) {
        setError(result.error)
        setNotice('文件无效，请根据右侧提示修正')
        return
      }

      commitCollection(result.data, { fit: true, dirty: false })
      setNotice(`已打开 ${file.name}`)
    },
    [commitCollection],
  )

  const handleSave = useCallback(() => {
    if (error) {
      setNotice('请先修正 GeoJSON 错误再下载')
      return
    }

    const blob = new Blob([stringifyGeoJson(data)], {
      type: 'application/geo+json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName.trim() || 'data.geojson'
    link.click()
    URL.revokeObjectURL(url)
    setIsDirty(false)
    setNotice('GeoJSON 文件已下载')
  }, [data, error, fileName])

  return (
    <div className="app-shell">
      <AppHeader
        fileName={fileName}
        featureCount={data.features.length}
        isDirty={isDirty}
        onFileNameChange={(name) => {
          setFileName(name)
          setIsDirty(true)
        }}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
      />

      <main className="workspace">
        <Suspense fallback={<div className="panel-loading">地图加载中…</div>}>
          <MapEditor
            data={data}
            revision={revision}
            fitRequest={fitRequest}
            selectedId={selectedId}
            onFit={() => setFitRequest((value) => value + 1)}
            onSelect={setSelectedId}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onRemove={handleRemove}
          />
        </Suspense>

        <section className="side-pane" aria-label="数据编辑区">
          <div className="tabs" role="tablist" aria-label="编辑模式">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'json'}
              className={activeTab === 'json' ? 'is-active' : ''}
              onClick={() => setActiveTab('json')}
            >
              <Braces size={15} />
              JSON
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'table'}
              className={activeTab === 'table' ? 'is-active' : ''}
              onClick={() => setActiveTab('table')}
            >
              <Table2 size={15} />
              属性表
            </button>
          </div>

          <div className="tab-content">
            <Suspense fallback={<div className="panel-loading">编辑器加载中…</div>}>
              {activeTab === 'json' ? (
                <JsonEditor
                  value={text}
                  error={error}
                  onChange={handleTextChange}
                  onFormat={() => {
                    const result = parseGeoJsonText(text)
                    if (result.ok) commitCollection(result.data)
                  }}
                />
              ) : (
                <PropertyTable
                  data={data}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onChangeProperty={handleChangeProperty}
                  onAddProperty={handleAddProperty}
                  onRemoveProperty={handleRemoveProperty}
                  onRemoveFeature={handleRemove}
                />
              )}
            </Suspense>
          </div>
        </section>
      </main>

      <footer className="status-bar">
        <span className={error ? 'status-error' : 'status-ok'}>
          {error ? '数据存在错误' : '数据有效'}
        </span>
        <span>WGS 84 · EPSG:4326</span>
        <span>浏览器本地自动保存</span>
      </footer>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="关闭通知"
            onClick={() => setNotice(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

export default App
