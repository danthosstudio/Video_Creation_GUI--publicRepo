interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </label>
        <span className="text-sm font-mono font-medium" style={{ color: 'var(--accent)' }}>
          {value.toFixed(1)}{unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
}
