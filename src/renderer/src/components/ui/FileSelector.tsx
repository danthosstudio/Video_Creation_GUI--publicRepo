import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileUp, X } from 'lucide-react'
import { basename } from '@/lib/utils'

interface FileSelectorProps {
  label: string
  filters: { name: string; extensions: string[] }[]
  multiple?: boolean
  value: string[]
  onChange: (files: string[]) => void
  icon?: React.ReactNode
}

export function FileSelector({ label, filters, multiple = false, value, onChange, icon }: FileSelectorProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleBrowse = async () => {
    if (multiple) {
      const files = await window.api.openFiles(filters)
      if (files) onChange(files)
    } else {
      const file = await window.api.openFile(filters)
      if (file) onChange([file])
    }
  }

  const handleClear = () => onChange([])

  const displayText = value.length === 0
    ? 'No file selected...'
    : value.length === 1
      ? basename(value[0])
      : `${value.length} files selected`

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>

      <motion.div
        whileHover={{ borderColor: 'var(--accent)' }}
        className="flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors"
        style={{
          background: 'var(--bg-card)',
          borderColor: isDragOver ? 'var(--accent)' : 'var(--border)',
          boxShadow: isDragOver ? '0 0 0 3px var(--accent-muted)' : 'none'
        }}
        onClick={handleBrowse}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          const files = Array.from(e.dataTransfer.files).map((f) => f.path)
          if (files.length > 0) {
            onChange(multiple ? files : [files[0]])
          }
        }}
      >
        {icon || <FileUp size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}

        <span
          className="flex-1 text-sm truncate"
          style={{ color: value.length > 0 ? 'var(--text)' : 'var(--text-dim)' }}
        >
          {displayText}
        </span>

        {value.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); handleClear() }}
            className="p-1 rounded-md"
            style={{ color: 'var(--text-dim)' }}
          >
            <X size={14} />
          </motion.button>
        )}

        <motion.span
          whileHover={{ backgroundColor: 'var(--accent-hover)' }}
          className="text-xs font-semibold px-3 py-1 rounded-lg shrink-0"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Browse
        </motion.span>
      </motion.div>
    </div>
  )
}
