import { motion } from 'framer-motion'
import { FolderOutput } from 'lucide-react'

interface OutputSelectorProps {
  label?: string
  value: string
  onChange: (path: string) => void
}

export function OutputSelector({ label = 'Output Folder', value, onChange }: OutputSelectorProps) {
  const handleBrowse = async () => {
    const dir = await window.api.openDirectory()
    if (dir) onChange(dir)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>

      <div
        className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <FolderOutput size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select output location..."
          className="flex-1 text-sm bg-transparent border-none outline-none"
          style={{ color: 'var(--text)' }}
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleBrowse}
          className="text-xs font-semibold px-3 py-1 rounded-lg shrink-0"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Browse
        </motion.button>
      </div>
    </div>
  )
}
