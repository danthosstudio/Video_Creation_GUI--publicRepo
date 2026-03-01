import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Minus, Square, X, Copy } from 'lucide-react'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api.isMaximized().then(setIsMaximized)

    // Listen for external maximize/unmaximize events (e.g. double-click title bar, snap)
    const cleanup = window.api.onMaximizeChange?.(setIsMaximized)
    return cleanup
  }, [])

  const handleMaximize = () => {
    window.api.maximize()
  }

  return (
    <div
      className="titlebar-drag flex items-center justify-between h-9 px-4 select-none shrink-0"
      style={{ background: 'var(--titlebar)' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent)' }} />
        <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>
          DanthosStudio
        </span>
      </div>

      <div className="titlebar-no-drag flex items-center">
        {[
          { icon: Minus, onClick: () => window.api.minimize(), hoverBg: 'rgba(255,255,255,0.1)' },
          {
            icon: isMaximized ? Copy : Square,
            onClick: handleMaximize,
            hoverBg: 'rgba(255,255,255,0.1)',
            size: isMaximized ? 11 : 12
          },
          { icon: X, onClick: () => window.api.close(), hoverBg: '#e81123' }
        ].map((btn, i) => (
          <motion.button
            key={i}
            whileHover={{ backgroundColor: btn.hoverBg }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center w-11 h-9 transition-colors"
            style={{ background: 'transparent' }}
            onClick={btn.onClick}
          >
            <btn.icon size={btn.size || 14} style={{ color: 'var(--text-muted)' }} />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
