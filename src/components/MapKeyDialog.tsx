import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink } from 'lucide-react'
import {
  ALL_KEY_PROVIDERS,
  MAP_KEY_PROVIDER_LABELS,
  type MapKeyProvider,
} from '../data/basemaps'
import {
  clearMapKey,
  getMapKey,
  setMapKey,
} from '../store/mapKeys'

/** 挂载到 body，避免被地图容器 overflow 裁剪 */
function DialogPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}

interface MapKeyDialogProps {
  provider: MapKeyProvider
  applyUrl: string
  onSave: (key: string) => void
  onCancel: () => void
}

export function MapKeyDialog({
  provider,
  applyUrl,
  onSave,
  onCancel,
}: MapKeyDialogProps) {
  const label = MAP_KEY_PROVIDER_LABELS[provider]
  const existingKey = getMapKey(provider)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = () => {
    const value = inputRef.current?.value.trim()
    if (value) onSave(value)
  }

  return (
    <DialogPortal>
      <div
        className="map-dialog-backdrop"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) onCancel()
        }}
      >
        <div
          className="map-dialog"
          role="dialog"
          aria-labelledby="map-key-dialog-title"
          aria-modal="true"
        >
          <h2 id="map-key-dialog-title">{label} API Key</h2>
        <p>
          使用{label}底图需要配置 API Key（天地图 Key 用于加载瓦片；高德/百度 Key 仅本地保存以备后续扩展）。Key 不会上传到服务器。
        </p>
          <p>
            <a href={applyUrl} target="_blank" rel="noreferrer">
              前往{label}开放平台申请 Key
              <ExternalLink size={14} />
            </a>
          </p>
          <label className="map-dialog-field">
            <span>API Key</span>
            <input
              ref={inputRef}
              type="password"
              defaultValue={existingKey ?? ''}
              placeholder={`请输入${label} API Key`}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  submit()
                }
              }}
            />
          </label>
          <div className="map-dialog-actions">
            <button type="button" className="button button-ghost" onClick={onCancel}>
              取消
            </button>
            <button type="button" className="button button-primary" onClick={submit}>
              保存并继续
            </button>
          </div>
        </div>
      </div>
    </DialogPortal>
  )
}

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <DialogPortal>
      <div
        className="map-dialog-backdrop"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) onCancel()
        }}
      >
        <div
          className="map-dialog"
          role="alertdialog"
          aria-labelledby="confirm-dialog-title"
          aria-modal="true"
        >
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{message}</p>
          <div className="map-dialog-actions">
            <button type="button" className="button button-ghost" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button type="button" className="button button-primary" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </DialogPortal>
  )
}

interface ManageKeysDialogProps {
  onClose: () => void
}

/** 管理已保存的国内地图 API Key */
export function ManageKeysDialog({ onClose }: ManageKeysDialogProps) {
  const providers = ALL_KEY_PROVIDERS
  const inputRefs = useRef<Partial<Record<MapKeyProvider, HTMLInputElement | null>>>({})

  const save = () => {
    providers.forEach((provider) => {
      const value = inputRefs.current[provider]?.value.trim()
      if (value) setMapKey(provider, value)
      else clearMapKey(provider)
    })
    onClose()
  }

  return (
    <DialogPortal>
      <div
        className="map-dialog-backdrop"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          className="map-dialog map-dialog-wide"
          role="dialog"
          aria-labelledby="manage-keys-title"
          aria-modal="true"
        >
          <h2 id="manage-keys-title">管理 API Key</h2>
          <p>各平台 Key 独立保存，仅用于加载对应底图瓦片。</p>
          <div className="map-key-list">
            {providers.map((provider) => (
              <label key={provider} className="map-dialog-field">
                <span>{MAP_KEY_PROVIDER_LABELS[provider]}</span>
                <input
                  ref={(element) => {
                    inputRefs.current[provider] = element
                  }}
                  type="password"
                  defaultValue={getMapKey(provider) ?? ''}
                  placeholder="未配置"
                />
              </label>
            ))}
          </div>
          <div className="map-dialog-actions">
            <button type="button" className="button button-ghost" onClick={onClose}>
              关闭
            </button>
            <button type="button" className="button button-primary" onClick={save}>
              保存
            </button>
          </div>
        </div>
      </div>
    </DialogPortal>
  )
}
