import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  delay?: number
}

export function Card({ children, className, hover = false, glow = false, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      whileHover={hover ? { y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } : {}}
      className={cn('rounded-xl border', glow && 'glow-sm', className)}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)'
      }}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pt-5 pb-3', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pb-5', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
      {children}
    </h2>
  )
}

export function CardDescription({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}
