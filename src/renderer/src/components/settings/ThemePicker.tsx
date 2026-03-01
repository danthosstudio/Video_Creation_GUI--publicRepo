import { useState } from 'react'
import { motion } from 'framer-motion'
import { Palette, Check, Plus, Trash2, Download, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { useTheme } from '@/hooks/useTheme'
import { themes, type ThemeColors } from '@/lib/themes'
import { CustomThemeEditor } from './CustomThemeEditor'
import { UpdateSection } from './UpdateSection'

export function SettingsPage() {
  const { currentTheme, allThemes, customThemes, setTheme, saveCustomTheme, deleteCustomTheme } = useTheme()
  const [showEditor, setShowEditor] = useState(false)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Customize your DanthosLabs experience
        </p>
      </div>

      {/* Updates */}
      <UpdateSection />

      {/* Built-in Themes */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={16} style={{ color: 'var(--accent)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Themes
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {allThemes.map((theme) => {
              const isActive = currentTheme.id === theme.id
              const isCustom = customThemes.some((ct) => ct.id === theme.id)

              return (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(theme.id)}
                  className="relative rounded-xl border p-4 text-left transition-all"
                  style={{
                    background: theme.colors['--bg-card'],
                    borderColor: isActive ? theme.colors['--accent'] : theme.colors['--border'],
                    boxShadow: isActive ? `0 0 20px ${theme.colors['--accent-glow']}` : 'none'
                  }}
                >
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: theme.colors['--accent'] }}
                    >
                      <Check size={12} color="#fff" />
                    </motion.div>
                  )}

                  {isCustom && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); deleteCustomTheme(theme.id) }}
                      className="absolute top-2 right-8 p-1 rounded-full"
                      style={{ background: 'rgba(255,0,0,0.2)', color: theme.colors['--error'] }}
                    >
                      <Trash2 size={10} />
                    </motion.button>
                  )}

                  <div className="space-y-3">
                    <span className="text-sm font-semibold" style={{ color: theme.colors['--text'] }}>
                      {theme.name}
                    </span>

                    {/* Color swatches */}
                    <div className="flex gap-1.5">
                      {[
                        theme.colors['--bg-primary'],
                        theme.colors['--bg-secondary'],
                        theme.colors['--bg-card'],
                        theme.colors['--accent'],
                        theme.colors['--accent-hover'],
                        theme.colors['--text']
                      ].map((color, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border"
                          style={{
                            background: color,
                            borderColor: theme.colors['--border']
                          }}
                        />
                      ))}
                    </div>

                    {/* Preview bar */}
                    <div
                      className="h-8 rounded-lg flex items-center px-3 gap-2"
                      style={{ background: theme.colors['--bg-secondary'] }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: theme.colors['--accent'] }}
                      />
                      <div
                        className="h-1.5 w-16 rounded-full"
                        style={{ background: theme.colors['--text-dim'] }}
                      />
                      <div className="flex-1" />
                      <div
                        className="h-4 w-12 rounded text-[8px] flex items-center justify-center font-bold"
                        style={{
                          background: theme.colors['--accent'],
                          color: theme.colors['--bg-primary']
                        }}
                      >
                        Btn
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Theme */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus size={16} style={{ color: 'var(--accent)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Custom Theme
              </h2>
            </div>
            <AnimatedButton
              size="sm"
              variant={showEditor ? 'secondary' : 'primary'}
              onClick={() => setShowEditor(!showEditor)}
            >
              {showEditor ? 'Close Editor' : 'Create Theme'}
            </AnimatedButton>
          </div>

          {showEditor && (
            <CustomThemeEditor
              onSave={(name, colors) => {
                saveCustomTheme(name, colors)
                setShowEditor(false)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="pt-5">
          <div className="text-center space-y-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold mx-auto"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              DS
            </div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              DanthosLabs Video Suite
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Built with Electron + React
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
