import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderOpen, File, Music, Film, Check } from 'lucide-react'
import { basename, cn } from '@/lib/utils'

interface FolderBrowserProps {
  label: string
  extensions: string[]
  value: string | null
  onSelect: (filePath: string | null) => void
  icon?: React.ReactNode
}

export function FolderBrowser({ label, extensions, value, onSelect, icon }: FolderBrowserProps) {
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  // Stabilize extensions reference to avoid infinite re-fetching
  const extensionsRef = useRef(extensions)
  extensionsRef.current = extensions

  useEffect(() => {
    if (folderPath) {
      window.api.listFiles(folderPath, extensionsRef.current).then(setFiles)
    }
  }, [folderPath])

  const handleBrowse = async () => {
    const dir = await window.api.openDirectory()
    if (dir) {
      setFolderPath(dir)
      setSelectedFile(null)
      onSelect(null)
    }
  }

  const handleSelectFile = (filename: string) => {
    setSelectedFile(filename)
    // Use the OS path separator — folderPath comes from native dialog, so just append with /
    // The native dialog on Windows returns backslash paths, the OS handles both fine
    const sep = folderPath && folderPath.includes('\\') ? '\\' : '/'
    onSelect(folderPath ? `${folderPath}${sep}${filename}` : null)
  }

  const getIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    if (['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'].includes(ext)) return Film
    if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'].includes(ext)) return Music
    return File
  }

  return (
    <div className="space-y-2 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </label>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleBrowse}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <FolderOpen size={12} />
          Browse Folder
        </motion.button>
      </div>

      {/* Folder path */}
      {folderPath && (
        <div className="flex items-center gap-2 text-xs px-2" style={{ color: 'var(--text-dim)' }}>
          <FolderOpen size={12} />
          <span className="truncate">{basename(folderPath)}</span>
        </div>
      )}

      {/* File list */}
      <div
        className="flex-1 rounded-xl border overflow-hidden min-h-[140px]"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="h-full overflow-y-auto p-1.5 space-y-0.5">
          {!folderPath ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <FolderOpen size={24} style={{ color: 'var(--text-dim)' }} />
              <span className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
                Select a folder to browse
              </span>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <File size={24} style={{ color: 'var(--text-dim)' }} />
              <span className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
                No compatible files found
              </span>
            </div>
          ) : (
            <AnimatePresence>
              {files.map((filename, i) => {
                const FileIcon = getIcon(filename)
                const isSelected = selectedFile === filename

                return (
                  <motion.button
                    key={filename}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    whileHover={{ x: 3 }}
                    onClick={() => handleSelectFile(filename)}
                    className={cn(
                      'file-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors'
                    )}
                    style={{
                      background: isSelected ? 'var(--accent-muted)' : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent'
                    }}
                  >
                    <FileIcon
                      size={14}
                      style={{ color: isSelected ? 'var(--accent)' : 'var(--text-dim)', flexShrink: 0 }}
                    />
                    <span
                      className="text-xs truncate flex-1"
                      style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}
                    >
                      {filename}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <Check size={12} style={{ color: 'var(--accent)' }} />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Selection display */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
        >
          <Check size={12} />
          <span className="truncate">{selectedFile}</span>
        </motion.div>
      )}
    </div>
  )
}
