import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { AnimatedButton } from '@/components/ui/AnimatedButton'

type SetupState =
  | { phase: 'checking' }
  | { phase: 'ready'; version: string }
  | { phase: 'missing' }
  | { phase: 'installing'; stage: string; percent: number }
  | { phase: 'installed' }
  | { phase: 'error'; message: string }

function FFmpegSetupGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SetupState>({ phase: 'checking' })

  // Check on mount
  useEffect(() => {
    window.api.checkFFmpeg().then((result) => {
      if (result.available) {
        setState({ phase: 'ready', version: result.version || 'unknown' })
      } else {
        setState({ phase: 'missing' })
      }
    }).catch(() => {
      setState({ phase: 'missing' })
    })
  }, [])

  // Listen for install progress
  useEffect(() => {
    const cleanup = window.api.onInstallProgress((stage, percent) => {
      setState({ phase: 'installing', stage, percent })
    })
    return cleanup
  }, [])

  const handleInstall = async () => {
    try {
      setState({ phase: 'installing', stage: 'Starting download...', percent: 0 })
      const result = await window.api.installFFmpeg()
      if (result.success) {
        setState({ phase: 'installed' })
        // Re-verify after a moment, then show the app
        setTimeout(async () => {
          try {
            const check = await window.api.checkFFmpeg()
            if (check.available) {
              setState({ phase: 'ready', version: check.version || 'unknown' })
            } else {
              setState({ phase: 'error', message: 'FFmpeg was installed but could not be verified. Try restarting the app.' })
            }
          } catch {
            setState({ phase: 'error', message: 'FFmpeg verification failed. Try restarting the app.' })
          }
        }, 500)
      } else {
        setState({ phase: 'error', message: result.error || 'Installation failed' })
      }
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Installation failed unexpectedly' })
    }
  }

  const handleRetry = () => setState({ phase: 'missing' })

  // If FFmpeg is ready, render the app
  if (state.phase === 'ready') {
    return <>{children}</>
  }

  // Setup / install screen
  return (
    <div className="h-screen flex flex-col items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border p-8 space-y-6 text-center"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            DS
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            DanthosLabs
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Video Suite v2.0
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Checking */}
          {state.phase === 'checking' && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <Loader2 size={24} className="animate-spin mx-auto" style={{ color: 'var(--accent)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Checking for FFmpeg...
              </p>
            </motion.div>
          )}

          {/* Missing - offer install */}
          {state.phase === 'missing' && (
            <motion.div
              key="missing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  FFmpeg is required for video processing
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  DanthosLabs can download and install it automatically.
                  This is a one-time setup (~80 MB download).
                </p>
              </div>

              <AnimatedButton
                size="lg"
                onClick={handleInstall}
                icon={<Download size={18} />}
                className="w-full"
              >
                Download & Install FFmpeg
              </AnimatedButton>
            </motion.div>
          )}

          {/* Installing - progress */}
          {state.phase === 'installing' && (
            <motion.div
              key="installing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {state.stage}
              </p>

              {/* Progress bar */}
              <div className="space-y-2">
                <div
                  className="h-2.5 rounded-full overflow-hidden"
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
                <p className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                  {Math.round(state.percent)}%
                </p>
              </div>

              <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                Please don't close the app during installation
              </p>
            </motion.div>
          )}

          {/* Installed - success */}
          {state.phase === 'installed' && (
            <motion.div
              key="installed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle size={40} className="mx-auto" style={{ color: 'var(--success)' }} />
              </motion.div>
              <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                FFmpeg installed successfully!
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Loading DanthosLabs...
              </p>
            </motion.div>
          )}

          {/* Error */}
          {state.phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <AlertTriangle size={32} className="mx-auto" style={{ color: 'var(--error)' }} />
              <div className="space-y-2">
                <p className="text-sm font-medium" style={{ color: 'var(--error)' }}>
                  Installation Failed
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {state.message}
                </p>
              </div>

              <div className="flex gap-2">
                <AnimatedButton size="md" onClick={handleRetry} className="flex-1">
                  Try Again
                </AnimatedButton>
              </div>

              <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                You can also install FFmpeg manually:
                {window.api.platform === 'win32'
                  ? ' download from ffmpeg.org and add bin/ to PATH'
                  : ' run "brew install ffmpeg" in Terminal'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <FFmpegSetupGate>
        <AppShell />
      </FFmpegSetupGate>
      <ToastProvider />
    </ThemeProvider>
  )
}
