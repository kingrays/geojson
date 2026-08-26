import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Braces, Table2, X } from 'lucide-react'
import type { Feature, GeoJsonProperties, Geometry } from 'geojson'
import { AppHeader } from './components/AppHeader'
import { ConfirmDialog, ManageKeysDialog, MapKeyDialog } from './components/MapKeyDialog'
import { getBasemap, isBasemapAllowedForPlatform, isDomesticBasemap, type MapKeyProvider } from './data/basemaps'
import {
  coordSysToTargetPlatform,
  getTargetPlatform,
  type TargetPlatform,
} from './data/coordSystems'
import { sampleGeoJson } from './data/sampleGeojson'
import { transformCollection } from './store/coordinates'
import {
  getSavedBasemapId,
  getSavedTargetPlatform,
  hasMapKey,
  setMapKey,
  setSavedBasemapId,
  setSavedTargetPlatform,
} from './store/mapKeys'
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
  targetPlatform?: TargetPlatform
  basemapId?: string
}

function getInitialDocument(): StoredDraft & { targetPlatform: TargetPlatform; basemapId: string } {
  const targetPlatform = getSavedTargetPlatform()
  let basemapId = getSavedBasemapId()
  if (!isBasemapAllowedForPlatform(basemapId, targetPlatform)) {
    basemapId = getTargetPlatform(targetPlatform).defaultBasemapId
  }

  const fallback = {
    data: cloneCollection(sampleGeoJson),
    fileName: '示例园区.geojson',
    targetPlatform,
    basemapId,
  }

  try {
    const rawDraft = localStorage.getItem(DRAFT_KEY)
    if (rawDraft) {
      const draft = JSON.parse(rawDraft) as Partial<StoredDraft>
      const result = parseGeoJsonText(JSON.stringify(draft.data))
      if (result.ok) {
        const targetPlatform =
          draft.targetPlatform ??
          (result.data.coordSys
            ? coordSysToTargetPlatform(result.data.coordSys)
            : getSavedTargetPlatform())
        let basemapId = draft.basemapId ?? getSavedBasemapId()
        if (!isBasemapAllowedForPlatform(basemapId, targetPlatform)) {
          basemapId = getTargetPlatform(targetPlatform).defaultBasemapId
        }
        return {
          data: result.data,
          fileName: draft.fileName || '已恢复草稿.geojson',
          targetPlatform,
          basemapId,
        }
      }
    }
  } catch {
    // 草稿损坏或浏览器禁用存储时，退回内置示例。
  }

  return fallback
}

function App() {
  const [initialDocument] = useState(getInitialDocument)
  const [data, setData] = useState(initialDocument.data)
  const [text, setText] = useState(() =>
    stringifyGeoJson(initialDocument.data, {
      coordSys: getTargetPlatform(initialDocument.targetPlatform).coordSys,
    }),
  )
  const [fileName, setFileName] = useState(initialDocument.fileName)
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>(
    initialDocument.targetPlatform,
  )
  const [basemapId, setBasemapId] = useState(initialDocument.basemapId)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'json' | 'table'>('json')
  const [revision, setRevision] = useState(0)
  const [fitRequest, setFitRequest] = useState(1)
  const [isDirty, setIsDirty] = useState(false)
  const [notice, setNotice] = useState<string | null>('已加载可编辑的示例数据')
  const [pendingPlatform, setPendingPlatform] = useState<TargetPlatform | null>(
    null,
  )
  const [showPlatformSuggest, setShowPlatformSuggest] = useState(false)
  const [showImportConvert, setShowImportConvert] = useState<{
    data: EditorFeatureCollection
    fromCoordSys: import('./data/coordSystems').CoordSysId
  } | null>(null)
  const [mapKeyDialog, setMapKeyDialog] = useState<{
    provider: MapKeyProvider
    applyUrl: string
    pendingBasemapId: string
  } | null>(null)
  const [showManageKeys, setShowManageKeys] = useState(false)

  const dataCrs = getTargetPlatform(targetPlatform).coordSys

  /** 切换底图前检测平台与 Key；缺失 Key 则弹出录入对话框 */
  const tryApplyBasemap = useCallback(
    (nextBasemapId: string, options: { suggestPlatform?: boolean } = {}) => {
      let resolvedId = nextBasemapId
      if (!isBasemapAllowedForPlatform(resolvedId, targetPlatform)) {
        resolvedId = getTargetPlatform(targetPlatform).defaultBasemapId
      }

      if (resolvedId === basemapId) return true

      const basemap = getBasemap(resolvedId)
      if (basemap.keyProvider && !hasMapKey(basemap.keyProvider)) {
        setMapKeyDialog({
          provider: basemap.keyProvider,
          applyUrl: basemap.keyApplyUrl ?? '#',
          pendingBasemapId: resolvedId,
        })
        return false
      }

      setBasemapId(resolvedId)
      setSavedBasemapId(resolvedId)
      if (
        options.suggestPlatform !== false &&
        isDomesticBasemap(resolvedId) &&
        targetPlatform === 'international'
      ) {
        setShowPlatformSuggest(true)
      }
      return true
    },
    [basemapId, targetPlatform],
  )

  const commitCollection = useCallback(
    (
      nextData: EditorFeatureCollection,
      options: { fit?: boolean; dirty?: boolean; coordSys?: typeof dataCrs } = {},
    ) => {
      const coordSys = options.coordSys ?? getTargetPlatform(targetPlatform).coordSys
      const withCoordSys = { ...nextData, coordSys }
      setData(withCoordSys)
      setText(stringifyGeoJson(withCoordSys, { coordSys }))
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
    [targetPlatform],
  )

  const applyTargetPlatform = useCallback(
    (nextPlatform: TargetPlatform, sourceData: EditorFeatureCollection) => {
      const current = getTargetPlatform(targetPlatform)
      const next = getTargetPlatform(nextPlatform)
      const transformed =
        current.coordSys === next.coordSys
          ? sourceData
          : transformCollection(sourceData, current.coordSys, next.coordSys)

      setTargetPlatform(nextPlatform)
      setSavedTargetPlatform(nextPlatform)
      commitCollection(transformed, { coordSys: next.coordSys })
      tryApplyBasemap(next.defaultBasemapId, { suggestPlatform: false })
      setNotice(`已切换用途平台为 ${next.label}`)
    },
    [commitCollection, targetPlatform, tryApplyBasemap],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const draft: StoredDraft = {
          data: { ...data, coordSys: dataCrs },
          fileName,
          targetPlatform,
          basemapId,
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      } catch {
        // 存储空间不足或隐私模式禁用存储时，不影响当前编辑。
      }
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [data, dataCrs, fileName, targetPlatform, basemapId])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  // 用途平台变化后，确保当前底图在允许列表内
  useEffect(() => {
    if (!isBasemapAllowedForPlatform(basemapId, targetPlatform)) {
      tryApplyBasemap(getTargetPlatform(targetPlatform).defaultBasemapId, {
        suggestPlatform: false,
      })
    }
  }, [basemapId, targetPlatform, tryApplyBasemap])

  // 恢复草稿时，若国内底图 Key 缺失则主动提示录入（仅检查初始底图）
  useEffect(() => {
    const basemap = getBasemap(initialDocument.basemapId)
    if (basemap.keyProvider && !hasMapKey(basemap.keyProvider)) {
      setMapKeyDialog({
        provider: basemap.keyProvider,
        applyUrl: basemap.keyApplyUrl ?? '#',
        pendingBasemapId: initialDocument.basemapId,
      })
    }
  }, [initialDocument.basemapId])

  const handleTargetPlatformChange = useCallback((nextPlatform: TargetPlatform) => {
    if (nextPlatform === targetPlatform) return
    setPendingPlatform(nextPlatform)
  }, [targetPlatform])

  const handleBasemapChange = useCallback(
    (nextBasemapId: string) => {
      tryApplyBasemap(nextBasemapId)
    },
    [tryApplyBasemap],
  )

  const handleTextChange = useCallback((nextText: string) => {
    setText(nextText)
    setIsDirty(true)
    const result = parseGeoJsonText(nextText)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setError(null)
    setData({ ...result.data, coordSys: dataCrs })
    setRevision((value) => value + 1)
    setSelectedId((current) =>
      result.data.features.some((feature) => feature.id === current)
        ? current
        : null,
    )
  }, [dataCrs])

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

      const importedCoordSys = result.data.coordSys ?? 'WGS84'

      if (importedCoordSys !== dataCrs) {
        setShowImportConvert({
          data: result.data,
          fromCoordSys: importedCoordSys,
        })
        setNotice(
          result.data.coordSys
            ? `已打开 ${file.name}，坐标系与当前用途平台不一致`
            : `已打开 ${file.name}，文件未标注坐标系，已按 WGS84 处理`,
        )
        return
      }

      commitCollection(result.data, { fit: true, dirty: false, coordSys: importedCoordSys })
      setNotice(`已打开 ${file.name}`)
    },
    [commitCollection, dataCrs],
  )

  const handleSave = useCallback(() => {
    if (error) {
      setNotice('请先修正 GeoJSON 错误再下载')
      return
    }

    const blob = new Blob([stringifyGeoJson(data, { coordSys: dataCrs })], {
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
  }, [data, dataCrs, error, fileName])

  const pendingPlatformDef = pendingPlatform
    ? getTargetPlatform(pendingPlatform)
    : null

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
            dataCrs={dataCrs}
            basemapId={basemapId}
            targetPlatform={targetPlatform}
            onBasemapChange={handleBasemapChange}
            onManageKeys={() => setShowManageKeys(true)}
            onTargetPlatformChange={handleTargetPlatformChange}
            onSuggestTargetPlatform={() => setShowPlatformSuggest(true)}
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
        <span>{getTargetPlatform(targetPlatform).statusLabel}</span>
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

      {pendingPlatformDef && (
        <ConfirmDialog
          title="切换用途平台"
          message={pendingPlatformDef.confirmMessage}
          confirmLabel="确认转换"
          onConfirm={() => {
            if (pendingPlatform) applyTargetPlatform(pendingPlatform, data)
            setPendingPlatform(null)
          }}
          onCancel={() => setPendingPlatform(null)}
        />
      )}

      {showPlatformSuggest && (
        <ConfirmDialog
          title="建议切换用途平台"
          message="当前使用的是国内底图，但数据坐标系仍为国际标准 (WGS84)。切换到「天地图 / 高德」可确保导出数据叠加国内地图时不偏移。"
          confirmLabel="切换为天地图 / 高德"
          onConfirm={() => {
            applyTargetPlatform('gcj', data)
            setShowPlatformSuggest(false)
          }}
          onCancel={() => setShowPlatformSuggest(false)}
        />
      )}

      {showImportConvert && (
        <ConfirmDialog
          title="转换坐标系"
          message={`文件坐标系为 ${showImportConvert.fromCoordSys}，当前用途平台为 ${getTargetPlatform(targetPlatform).label}（${dataCrs}）。是否将坐标转换为当前用途平台坐标系？`}
          confirmLabel="转换并加载"
          cancelLabel="按原始坐标系加载"
          onConfirm={() => {
            const converted = transformCollection(
              showImportConvert.data,
              showImportConvert.fromCoordSys,
              dataCrs,
            )
            commitCollection(converted, { fit: true, dirty: false, coordSys: dataCrs })
            setShowImportConvert(null)
            setNotice('已转换坐标系并加载文件')
          }}
          onCancel={() => {
            const imported = showImportConvert.data
            const platform = coordSysToTargetPlatform(showImportConvert.fromCoordSys)
            setTargetPlatform(platform)
            setSavedTargetPlatform(platform)
            commitCollection(imported, {
              fit: true,
              dirty: false,
              coordSys: showImportConvert.fromCoordSys,
            })
            setShowImportConvert(null)
            setNotice('已按文件原始坐标系加载')
          }}
        />
      )}
      {mapKeyDialog && (
        <MapKeyDialog
          provider={mapKeyDialog.provider}
          applyUrl={mapKeyDialog.applyUrl}
          onSave={(key) => {
            setMapKey(mapKeyDialog.provider, key)
            setBasemapId(mapKeyDialog.pendingBasemapId)
            setSavedBasemapId(mapKeyDialog.pendingBasemapId)
            setMapKeyDialog(null)
            setNotice('API Key 已保存，底图已切换')
          }}
          onCancel={() => {
            const pendingId = mapKeyDialog.pendingBasemapId
            setMapKeyDialog(null)
            // 当前已处于待切换底图且无 Key 时，回退 OSM 避免灰屏
            if (
              basemapId === pendingId &&
              getBasemap(pendingId).keyProvider &&
              !hasMapKey(getBasemap(pendingId).keyProvider as MapKeyProvider)
            ) {
              setBasemapId('osm')
              setSavedBasemapId('osm')
            }
          }}
        />
      )}

      {showManageKeys && (
        <ManageKeysDialog
          targetPlatform={targetPlatform}
          onClose={() => setShowManageKeys(false)}
        />
      )}
    </div>
  )
}

export default App
