import { motion } from 'framer-motion'
import {
  BookOpen,
  Image,
  ImagePlay,
  Repeat,
  Merge,
  Smartphone,
  Music,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export type TabId =
  | 'guide'
  | 'picture-to-video'
  | 'picture-audio'
  | 'loop-video'
  | 'video-audio'
  | 'youtube-shorts'
  | 'multi-audio'
  | 'settings'

interface NavItem {
  id: TabId
  label: string
  icon: typeof Image
}

const mainNavItems: NavItem[] = [
  { id: 'guide', label: 'Guide', icon: BookOpen },
  { id: 'picture-to-video', label: 'Picture to Video', icon: Image },
  { id: 'picture-audio', label: 'Picture + Audio', icon: ImagePlay },
  { id: 'loop-video', label: 'Loop Video', icon: Repeat },
  { id: 'video-audio', label: 'Video + Audio', icon: Merge },
  { id: 'youtube-shorts', label: 'YouTube Shorts', icon: Smartphone },
  { id: 'multi-audio', label: 'Multi-Audio', icon: Music }
]

const settingsItem: NavItem = { id: 'settings', label: 'Settings', icon: Settings }

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.nav
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full flex flex-col shrink-0 border-r"
      style={{ background: 'var(--sidebar)', borderColor: 'var(--border)' }}
    >
      {/* Logo area */}
      <div className="flex items-center h-14 px-3 border-b" style={{ borderColor: 'var(--border)' }}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              DS
            </div>
            <div className="overflow-hidden whitespace-nowrap">
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                DanthosStudio
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                Video Suite v2
              </div>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mx-auto"
            style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            DS
          </div>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col py-2 px-2 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <div key={item.id}>
                <motion.button
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg transition-all duration-150 relative',
                    collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                  )}
                  style={{
                    background: isActive ? 'var(--accent-muted)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)'
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: 'var(--accent)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon size={18} className="shrink-0" />
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </motion.button>
              </div>
            )
          })}
        </div>

        {/* Settings pinned to bottom */}
        <div className="mt-auto pt-2">
          {(() => {
            const isActive = activeTab === settingsItem.id
            return (
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onTabChange(settingsItem.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg transition-all duration-150 relative',
                  collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                )}
                style={{
                  background: isActive ? 'var(--accent-muted)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <settingsItem.icon size={18} className="shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium truncate"
                  >
                    {settingsItem.label}
                  </motion.span>
                )}
              </motion.button>
            )
          })()}
        </div>
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <motion.button
          whileHover={{ backgroundColor: 'var(--bg-card-hover)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-dim)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </motion.button>
      </div>
    </motion.nav>
  )
}
