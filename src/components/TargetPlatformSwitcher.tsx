import { TARGET_PLATFORMS, type TargetPlatform } from '../data/coordSystems'

interface TargetPlatformSwitcherProps {
  value: TargetPlatform
  onChange: (platform: TargetPlatform) => void
}

export function TargetPlatformSwitcher({
  value,
  onChange,
}: TargetPlatformSwitcherProps) {
  return (
    <label className="map-control">
      <span className="map-control-label">导出给</span>
      <select
        className="map-control-select"
        value={value}
        aria-label="导出给"
        onChange={(event) => onChange(event.target.value as TargetPlatform)}
      >
        {TARGET_PLATFORMS.map((platform) => (
          <option key={platform.id} value={platform.id}>
            {platform.label}
          </option>
        ))}
      </select>
    </label>
  )
}
