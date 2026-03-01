/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-muted': 'var(--accent-muted)',
        surface: 'var(--text)',
        'surface-muted': 'var(--text-muted)',
        'surface-dim': 'var(--text-dim)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)'
      },
      boxShadow: {
        glow: '0 0 20px var(--accent-glow)',
        'glow-sm': '0 0 10px var(--accent-glow)',
        card: '0 4px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.4)'
      },
      backdropBlur: {
        xs: '2px'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px var(--accent-glow)' },
          '50%': { boxShadow: '0 0 25px var(--accent-glow)' }
        }
      }
    }
  },
  plugins: []
}
