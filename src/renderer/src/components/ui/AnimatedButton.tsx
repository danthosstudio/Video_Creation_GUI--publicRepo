import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

export function AnimatedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const baseStyles = 'group inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors relative overflow-hidden'

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3'
  }

  const variantStyles = {
    primary: 'text-white',
    secondary: '',
    ghost: ''
  }

  const isDisabled = disabled || loading

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      style={{
        background:
          variant === 'primary'
            ? isDisabled
              ? 'var(--text-dim)'
              : 'var(--accent)'
            : variant === 'secondary'
              ? 'var(--bg-card)'
              : 'transparent',
        color:
          variant === 'primary'
            ? '#ffffff'
            : 'var(--text)',
        border: variant === 'secondary' ? '1px solid var(--border)' : 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1
      }}
      disabled={isDisabled}
      {...props}
    >
      {/* Shimmer overlay — visible on hover via CSS (parent has group class) */}
      {variant === 'primary' && !isDisabled && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            pointerEvents: 'none'
          }}
        />
      )}
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
