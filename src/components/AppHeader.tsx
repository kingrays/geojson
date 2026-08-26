import { useRef } from 'react'
import { Braces, Download, FilePlus2, FolderOpen } from 'lucide-react'

interface AppHeaderProps {
  fileName: string
  featureCount: number
  isDirty: boolean
  onFileNameChange: (name: string) => void
  onNew: () => void
  onOpen: (file: File) => void
  onSave: () => void
}

export function AppHeader({
  fileName,
  featureCount,
  isDirty,
  onFileNameChange,
  onNew,
  onOpen,
  onSave,
}: AppHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <Braces size={20} />
        </span>
        <div>
          <strong>GeoJSON Studio</strong>
          <span>{featureCount} 个要素</span>
        </div>
      </div>

      <div className="document-name">
        <input
          value={fileName}
          aria-label="文件名"
          onChange={(event) => onFileNameChange(event.target.value)}
        />
        {isDirty && <span className="dirty-dot" title="存在未下载的修改" />}
      </div>

      <nav className="file-actions" aria-label="文件操作">
        <button className="button button-ghost" type="button" onClick={onNew}>
          <FilePlus2 size={16} />
          新建
        </button>
        <button
          className="button button-ghost"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <FolderOpen size={16} />
          打开
        </button>
        <button className="button button-primary" type="button" onClick={onSave}>
          <Download size={16} />
          下载
        </button>
        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept=".geojson,.json,application/geo+json,application/json"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onOpen(file)
            event.target.value = ''
          }}
        />
      </nav>
    </header>
  )
}
