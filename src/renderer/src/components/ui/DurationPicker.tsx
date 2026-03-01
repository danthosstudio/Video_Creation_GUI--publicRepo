import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'

interface DurationPickerProps {
  value: number
  onChange: (seconds: number) => void
  options?: { label: string; seconds: number }[]
}

const defaultOptions = [
  { label: '30 Min', seconds: 1800 },
  { label: '1 Hour', seconds: 3600 },
  { label: '2 Hours', seconds: 7200 },
  { label: '3 Hours', seconds: 10800 },
  { label: 'Custom', seconds: -1 }
]

export function DurationPicker({ value, onChange, options = defaultOptions }: DurationPickerProps) {
  const [isCustom, setIsCustom] = useState(!options.some((o) => o.seconds === value))
  const [customValue, setCustomValue] = useState(String(value))

  const handleSelect = (seconds: number) => {
    if (seconds === -1) {
      setIsCustom(true)
    } else {
      setIsCustom(false)
      onChange(seconds)
    }
  }

  const handleCustomChange = (val: string) => {
    setCustomValue(val)
    const num = parseInt(val, 10)
    if (!isNaN(num) && num > 0) onChange(num)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        <Clock size={12} />
        Duration
      </label>

      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = opt.seconds === -1 ? isCustom : opt.seconds === value && !isCustom

          return (
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(opt.seconds)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                background: isActive ? 'var(--accent-muted)' : 'var(--bg-card)',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              {opt.label}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {isCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                value={customValue}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="3600"
                className="w-28 text-sm"
                min={1}
              />
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                seconds
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
