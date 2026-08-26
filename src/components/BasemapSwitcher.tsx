import { getBasemapsForPlatform } from '../data/basemaps'
import type { TargetPlatform } from '../data/coordSystems'

interface BasemapSwitcherProps {
  value: string
  targetPlatform: TargetPlatform
  onChange: (basemapId: string) => void
  onManageKeys: () => void
}

export function BasemapSwitcher({
  value,
  targetPlatform,
  onChange,
  onManageKeys,
}: BasemapSwitcherProps) {
  const basemaps = getBasemapsForPlatform(targetPlatform)

  return (
    <>
      <label className="map-control">
        <span className="map-control-label">底图</span>
        <select
          className="map-control-select"
          value={value}
          aria-label="底图"
          onChange={(event) => onChange(event.target.value)}
        >
          {basemaps.map((basemap) => (
            <option key={basemap.id} value={basemap.id}>
              {basemap.label}
            </option>
          ))}
        </select>
      </label>
      {targetPlatform !== 'international' && (
        <button type="button" className="map-manage-keys" onClick={onManageKeys}>
          管理 Key
        </button>
      )}
    </>
  )
}
