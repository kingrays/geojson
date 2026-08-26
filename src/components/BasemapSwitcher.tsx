import { getAllBasemaps } from '../data/basemaps'

interface BasemapSwitcherProps {
  value: string
  onChange: (basemapId: string) => void
  onManageKeys: () => void
}

export function BasemapSwitcher({
  value,
  onChange,
  onManageKeys,
}: BasemapSwitcherProps) {
  const basemaps = getAllBasemaps()

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
      <button type="button" className="map-manage-keys" onClick={onManageKeys}>
        管理 Key
      </button>
    </>
  )
}
