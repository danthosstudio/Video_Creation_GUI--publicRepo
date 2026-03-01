import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { themes, type ThemeColors } from '@/lib/themes'

interface CustomThemeEditorProps {
  onSave: (name: string, colors: ThemeColors) => void
}

const editableColors: { key: keyof ThemeColors; label: string }[] = [
  { key: '--bg-primary', label: 'Background' },
  { key: '--bg-secondary', label: 'Secondary BG' },
  { key: '--bg-card', label: 'Card BG' },
  { key: '--bg-card-hover', label: 'Card Hover' },
  { key: '--accent', label: 'Accent' },
  { key: '--accent-hover', label: 'Accent Hover' },
  { key: '--text', label: 'Text' },
  { key: '--text-muted', label: 'Text Muted' },
  { key: '--border', label: 'Border' },
  { key: '--success', label: 'Success' },
  { key: '--error', label: 'Error' }
]

export function CustomThemeEditor({ onSave }: CustomThemeEditorProps) {
  const baseTheme = themes[0] // Start from Dark Pro
  const [name, setName] = useState('')
  const [colors, setColors] = useState<ThemeColors>({ ...baseTheme.colors })

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => {
      const updated = { ...prev, [key]: value }
      // Auto-derive related colors
      if (key === '--accent') {
        updated['--accent-muted'] = `${value}26`
        updated['--accent-glow'] = `${value}40`
      }
      if (key === '--bg-primary') {
        updated['--titlebar'] = value
        updated['--sidebar'] = value
      }
      return updated
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), colors)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-4 pt-2"
    >
      {/* Theme name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Theme Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Custom Theme"
          className="w-full text-sm"
        />
      </div>

      {/* Color grid */}
      <div className="grid grid-cols-2 gap-3">
        {editableColors.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={colors[key].startsWith('#') ? colors[key] : '#000000'}
                onChange={(e) => updateColor(key, e.target.value)}
                className="w-8 h-8 rounded-lg border cursor-pointer appearance-none"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: colors[key]
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                {label}
              </div>
              <div className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
                {colors[key]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div
        className="rounded-xl p-4 space-y-3 border"
        style={{
          background: colors['--bg-primary'],
          borderColor: colors['--border']
        }}
      >
        <div className="text-xs font-semibold" style={{ color: colors['--text-muted'] }}>
          Preview
        </div>
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: colors['--bg-card'], border: `1px solid ${colors['--border']}` }}
        >
          <div className="text-sm font-semibold" style={{ color: colors['--text'] }}>
            Card Title
          </div>
          <div className="text-xs" style={{ color: colors['--text-muted'] }}>
            This is how your theme will look
          </div>
          <div className="flex gap-2">
            <div
              className="text-[10px] font-bold px-3 py-1 rounded-md"
              style={{ background: colors['--accent'], color: '#fff' }}
            >
              Button
            </div>
            <div
              className="text-[10px] px-3 py-1 rounded-md border"
              style={{ borderColor: colors['--border'], color: colors['--text-muted'] }}
            >
              Secondary
            </div>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: colors['--bg-secondary'] }}>
            <div
              className="h-full w-2/3 rounded-full"
              style={{ background: colors['--accent'] }}
            />
          </div>
        </div>
      </div>

      <AnimatedButton
        size="md"
        onClick={handleSave}
        disabled={!name.trim()}
        icon={<Save size={16} />}
        className="w-full"
      >
        Save Theme
      </AnimatedButton>
    </motion.div>
  )
}
