import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number
  status: string
  isSuccess?: boolean
  isError?: boolean
  className?: string
}

export function ProgressBar({ progress, status, isSuccess, isError, className }: ProgressBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium truncate"
          style={{
            color: isError ? 'var(--error)' : isSuccess ? 'var(--success)' : 'var(--text-muted)'
          }}
        >
          {status}
        </span>
        {progress > 0 && progress < 100 && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
            {Math.round(progress)}%
          </span>
        )}
      </div>

      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <motion.div
          className={cn('h-full rounded-full', progress > 0 && progress < 100 && 'progress-active')}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{
            background: isError
              ? 'var(--error)'
              : isSuccess
                ? 'var(--success)'
                : `linear-gradient(90deg, var(--accent), var(--accent-hover))`,
            boxShadow: progress > 0 ? `0 0 12px var(--accent-glow)` : 'none'
          }}
        />
      </div>
    </div>
  )
}
