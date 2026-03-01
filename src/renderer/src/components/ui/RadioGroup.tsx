import { motion } from 'framer-motion'

interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  label?: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
}

export function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = opt.value === value

          return (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(opt.value)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm transition-colors"
              style={{
                background: isActive ? 'var(--accent-muted)' : 'var(--bg-card)',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: isActive ? 'var(--accent)' : 'var(--text-dim)' }}
              >
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </div>
              <div className="text-left">
                <div className="font-medium text-xs">{opt.label}</div>
                {opt.description && (
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {opt.description}
                  </div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
