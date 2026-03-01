import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TitleBar } from './TitleBar'
import { Sidebar, type TabId } from './Sidebar'
import { Guide } from '@/components/tabs/Guide'
import { PictureToVideo } from '@/components/tabs/PictureToVideo'
import { PictureAudio } from '@/components/tabs/PictureAudio'
import { LoopVideo } from '@/components/tabs/LoopVideo'
import { VideoAudioMerge } from '@/components/tabs/VideoAudioMerge'
import { YouTubeShorts } from '@/components/tabs/YouTubeShorts'
import { MultiAudio } from '@/components/tabs/MultiAudio'
import { SettingsPage } from '@/components/settings/ThemePicker'

const tabComponents: Record<TabId, () => JSX.Element> = {
  guide: Guide,
  'picture-to-video': PictureToVideo,
  'picture-audio': PictureAudio,
  'loop-video': LoopVideo,
  'video-audio': VideoAudioMerge,
  'youtube-shorts': YouTubeShorts,
  'multi-audio': MultiAudio,
  settings: SettingsPage
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('guide')

  const ActiveComponent = tabComponents[activeTab]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full overflow-y-auto p-6"
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
