export interface ThemeColors {
  '--bg-primary': string
  '--bg-secondary': string
  '--bg-card': string
  '--bg-card-hover': string
  '--accent': string
  '--accent-hover': string
  '--accent-muted': string
  '--accent-glow': string
  '--text': string
  '--text-muted': string
  '--text-dim': string
  '--border': string
  '--border-hover': string
  '--success': string
  '--error': string
  '--warning': string
  '--titlebar': string
  '--sidebar': string
  '--scrollbar': string
  '--scrollbar-hover': string
}

export interface Theme {
  id: string
  name: string
  colors: ThemeColors
}

export const themes: Theme[] = [
  {
    id: 'dark-pro',
    name: 'Dark Pro',
    colors: {
      '--bg-primary': '#0f0f0f',
      '--bg-secondary': '#171717',
      '--bg-card': '#1e1e1e',
      '--bg-card-hover': '#262626',
      '--accent': '#3b82f6',
      '--accent-hover': '#60a5fa',
      '--accent-muted': 'rgba(59,130,246,0.15)',
      '--accent-glow': 'rgba(59,130,246,0.25)',
      '--text': '#e4e4e7',
      '--text-muted': '#a1a1aa',
      '--text-dim': '#52525b',
      '--border': '#27272a',
      '--border-hover': '#3f3f46',
      '--success': '#22c55e',
      '--error': '#ef4444',
      '--warning': '#f59e0b',
      '--titlebar': '#0a0a0a',
      '--sidebar': '#111111',
      '--scrollbar': '#333333',
      '--scrollbar-hover': '#555555'
    }
  },
  {
    id: 'light',
    name: 'Light Clean',
    colors: {
      '--bg-primary': '#f8fafc',
      '--bg-secondary': '#f1f5f9',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#f8fafc',
      '--accent': '#2563eb',
      '--accent-hover': '#3b82f6',
      '--accent-muted': 'rgba(37,99,235,0.1)',
      '--accent-glow': 'rgba(37,99,235,0.15)',
      '--text': '#1e293b',
      '--text-muted': '#64748b',
      '--text-dim': '#94a3b8',
      '--border': '#e2e8f0',
      '--border-hover': '#cbd5e1',
      '--success': '#16a34a',
      '--error': '#dc2626',
      '--warning': '#d97706',
      '--titlebar': '#e2e8f0',
      '--sidebar': '#f1f5f9',
      '--scrollbar': '#cbd5e1',
      '--scrollbar-hover': '#94a3b8'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      '--bg-primary': '#0c0a1d',
      '--bg-secondary': '#110e26',
      '--bg-card': '#1a1635',
      '--bg-card-hover': '#221e42',
      '--accent': '#8b5cf6',
      '--accent-hover': '#a78bfa',
      '--accent-muted': 'rgba(139,92,246,0.15)',
      '--accent-glow': 'rgba(139,92,246,0.3)',
      '--text': '#e2e0f0',
      '--text-muted': '#8b87a8',
      '--text-dim': '#5a5675',
      '--border': '#2a2548',
      '--border-hover': '#3d3762',
      '--success': '#34d399',
      '--error': '#f87171',
      '--warning': '#fbbf24',
      '--titlebar': '#080618',
      '--sidebar': '#0e0b22',
      '--scrollbar': '#2a2548',
      '--scrollbar-hover': '#3d3762'
    }
  },
  {
    id: 'warm-gold',
    name: 'Warm Gold',
    colors: {
      '--bg-primary': '#151210',
      '--bg-secondary': '#1c1814',
      '--bg-card': '#262019',
      '--bg-card-hover': '#302a1f',
      '--accent': '#d4a574',
      '--accent-hover': '#e8c097',
      '--accent-muted': 'rgba(212,165,116,0.15)',
      '--accent-glow': 'rgba(212,165,116,0.25)',
      '--text': '#f5e6d3',
      '--text-muted': '#b8a68e',
      '--text-dim': '#7a6d5d',
      '--border': '#3a3229',
      '--border-hover': '#504636',
      '--success': '#4ade80',
      '--error': '#fb7185',
      '--warning': '#fcd34d',
      '--titlebar': '#0f0d0a',
      '--sidebar': '#13100d',
      '--scrollbar': '#3a3229',
      '--scrollbar-hover': '#504636'
    }
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    colors: {
      '--bg-primary': '#050505',
      '--bg-secondary': '#0a0a0a',
      '--bg-card': '#111111',
      '--bg-card-hover': '#1a1a1a',
      '--accent': '#22d3ee',
      '--accent-hover': '#67e8f9',
      '--accent-muted': 'rgba(34,211,238,0.12)',
      '--accent-glow': 'rgba(34,211,238,0.35)',
      '--text': '#e0f2fe',
      '--text-muted': '#7dd3fc',
      '--text-dim': '#475569',
      '--border': '#1e293b',
      '--border-hover': '#334155',
      '--success': '#4ade80',
      '--error': '#f43f5e',
      '--warning': '#facc15',
      '--titlebar': '#020202',
      '--sidebar': '#070707',
      '--scrollbar': '#1e293b',
      '--scrollbar-hover': '#334155'
    }
  }
]

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0]
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(key, value)
  }
}
