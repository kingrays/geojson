import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { Braces, CheckCircle2, WandSparkles } from 'lucide-react'

interface JsonEditorProps {
  value: string
  error: string | null
  onChange: (value: string) => void
  onFormat: () => void
}

export function JsonEditor({
  value,
  error,
  onChange,
  onFormat,
}: JsonEditorProps) {
  return (
    <div className="json-editor">
      <div className="panel-toolbar">
        <span className="panel-toolbar-title">
          <Braces size={16} />
          GeoJSON 文档
        </span>
        <button
          className="button button-subtle"
          type="button"
          onClick={onFormat}
          disabled={Boolean(error)}
        >
          <WandSparkles size={15} />
          格式化
        </button>
      </div>
      <CodeMirror
        value={value}
        height="100%"
        extensions={[json()]}
        onChange={onChange}
        basicSetup={{
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
          bracketMatching: true,
          closeBrackets: true,
        }}
        aria-label="GeoJSON JSON 编辑器"
      />
      <div className={`editor-status ${error ? 'is-error' : 'is-valid'}`}>
        {error ? (
          <span title={error}>{error}</span>
        ) : (
          <>
            <CheckCircle2 size={14} />
            JSON 与 GeoJSON 结构有效
          </>
        )}
      </div>
    </div>
  )
}
