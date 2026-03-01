import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Download, RotateCcw, CheckCircle, AlertTriangle, Loader2, ChevronDown, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { changelog, getChangelogForVersion } from '@/lib/changelog'

type UpdateState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string; releaseNotes?: string }
  | { phase: 'not-available'; version: string }
  | { phase: 'downloading'; percent: number; transferred: number; total: number }
  | { phase: 'downloaded'; version: string }
  | { phase: 'error'; message: string }

export function UpdateSection() {
  const [appVersion, setAppVersion] = useState('...')
  const [state, setState] = useState<UpdateState>({ phase: 'idle' })
  const [showChangelog, setShowChangelog] = useState(false)

  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion)

    const cleanup = window.api.onUpdateStatus((status) => {
      switch (status.event) {
        case 'checking':
          setState({ phase: 'checking' })
          break
        case 'available':
          setState({ phase: 'available', version: status.version!, releaseNotes: status.releaseNotes })
          break
        case 'not-available':
          setState({ phase: 'not-available', version: status.version! })
          break
        case 'downloading':
          setState({
            phase: 'downloading',
            percent: status.percent!,
            transferred: status.transferred!,
            total: status.total!
          })
          break
        case 'downloaded':
          setState({ phase: 'downloaded', version: status.version! })
          break
        case 'error':
          setState({ phase: 'error', message: status.message! })
          break
      }
    })

    return cleanup
  }, [])

  const handleCheck = () => {
    setState({ phase: 'checking' })
    window.api.checkForUpdates()
  }

  const handleDownload = () => {
    window.api.downloadUpdate()
  }

  const handleInstall = () => {
    window.api.installUpdate()
  }

  const handleDismiss = () => {
    setState({ phase: 'idle' })
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                App Updates
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                Current version: v{appVersion}
              </p>
            </div>

            {/* Action button based on state */}
            {(state.phase === 'idle' || state.phase === 'error' || state.phase === 'not-available') && (
              <AnimatedButton size="sm" onClick={handleCheck} icon={<RefreshCw size={14} />}>
                Check for Updates
              </AnimatedButton>
            )}
          </div>

          {/* Status area */}
          <AnimatePresence mode="wait">
            {state.phase === 'checking' && (
              <motion.div
                key="checking"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 py-2"
              >
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Checking for updates...
                </span>
              </motion.div>
            )}

            {state.phase === 'not-available' && (
              <motion.div
                key="up-to-date"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 py-2"
              >
                <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                <span className="text-xs" style={{ color: 'var(--success)' }}>
                  You're on the latest version!
                </span>
              </motion.div>
            )}

            {state.phase === 'available' && (
              <motion.div
                key="available"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--accent-muted)' }}
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      v{state.version} available
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      A new version is ready to download
                    </p>
                  </div>
                  <AnimatedButton size="sm" onClick={handleDownload} icon={<Download size={14} />}>
                    Download & Install
                  </AnimatedButton>
                </div>
              </motion.div>
            )}

            {state.phase === 'downloading' && (
              <motion.div
                key="downloading"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Downloading update...
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                    {Math.round(state.percent)}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${state.percent}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                    style={{
                      background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
                      boxShadow: '0 0 12px var(--accent-glow)'
                    }}
                  />
                </div>
                <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                  {(state.transferred / 1024 / 1024).toFixed(1)} / {(state.total / 1024 / 1024).toFixed(0)} MB
                </p>
              </motion.div>
            )}

            {state.phase === 'downloaded' && (
              <motion.div
                key="downloaded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                      v{state.version} ready to install
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      The app will restart to apply the update
                    </p>
                  </div>
                  <AnimatedButton size="sm" onClick={handleInstall} icon={<RotateCcw size={14} />}>
                    Restart to Update
                  </AnimatedButton>
                </div>
              </motion.div>
            )}

            {state.phase === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 py-2"
              >
                <AlertTriangle size={14} style={{ color: 'var(--error)' }} />
                <span className="text-xs" style={{ color: 'var(--error)' }}>
                  {state.message}
                </span>
                <button
                  onClick={handleDismiss}
                  className="text-[10px] underline ml-auto"
                  style={{ color: 'var(--text-dim)' }}
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Changelog dropdown */}
          <div>
            <button
              onClick={() => setShowChangelog(!showChangelog)}
              className="flex items-center gap-2 w-full text-left py-1.5 group"
            >
              <FileText size={12} style={{ color: 'var(--text-dim)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Version Notes
              </span>
              <motion.div
                animate={{ rotate: showChangelog ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-auto"
              >
                <ChevronDown size={12} style={{ color: 'var(--text-dim)' }} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showChangelog && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 pt-2">
                    {changelog.map((entry) => {
                      const isCurrent = entry.version === appVersion
                      return (
                        <div
                          key={entry.version}
                          className="rounded-lg px-3 py-2.5 space-y-1.5"
                          style={{
                            background: isCurrent ? 'var(--accent-muted)' : 'var(--bg-secondary)',
                            border: isCurrent ? '1px solid var(--accent)' : '1px solid transparent'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-bold"
                              style={{ color: isCurrent ? 'var(--accent)' : 'var(--text)' }}
                            >
                              v{entry.version}
                            </span>
                            {isCurrent && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                              >
                                Current
                              </span>
                            )}
                            <span className="text-[10px] ml-auto" style={{ color: 'var(--text-dim)' }}>
                              {entry.date}
                            </span>
                          </div>
                          <ul className="space-y-0.5">
                            {entry.highlights.map((note, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span
                                  className="text-[8px] mt-1 shrink-0"
                                  style={{ color: 'var(--text-dim)' }}
                                >
                                  ●
                                </span>
                                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                  {note}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
