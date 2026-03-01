import { motion } from 'framer-motion'
import {
  Image,
  ImagePlay,
  Repeat,
  Merge,
  Smartphone,
  Music,
  Settings,
  Zap,
  FolderOpen,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  steps: string[]
  tip?: string
  index: number
}

function FeatureCard({ icon, title, description, steps, tip, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
    >
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
            >
              {icon}
            </div>
            <div className="space-y-2 min-w-0">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
              <div className="space-y-1 pt-1">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              {tip && (
                <div
                  className="flex items-start gap-2 mt-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-dim)' }}
                >
                  <Zap size={12} className="shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                  <span>{tip}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const features: Omit<FeatureCardProps, 'index'>[] = [
  {
    icon: <Image size={20} />,
    title: 'Picture to Video',
    description:
      'Turn any image into a video of your chosen length. Great for creating background visuals, placeholder videos, or static content for video editors.',
    steps: [
      'Select an image file (JPG, PNG, BMP, TIFF, WebP)',
      'Choose a duration using the presets or enter a custom time',
      'Pick an output folder',
      'Click "Create Video" and wait for it to finish'
    ],
    tip: 'The output is a silent video. Use "Picture + Audio" if you need sound.'
  },
  {
    icon: <ImagePlay size={20} />,
    title: 'Picture + Audio to Video',
    description:
      'Combine a static image with an audio track to create a video. The video length automatically matches the audio duration. Perfect for music visualizers, podcast videos, or lyric backgrounds.',
    steps: [
      'Select an image file',
      'Select an audio file (MP3, WAV, FLAC, M4A, AAC, OGG)',
      'Choose an output folder',
      'Click "Create Video"'
    ],
    tip: 'The video duration is set by the audio length automatically.'
  },
  {
    icon: <Repeat size={20} />,
    title: 'Loop Video',
    description:
      'Take a short video clip and loop it to a target duration. Useful for creating extended background loops, ambient scenes, or filling time in a longer project.',
    steps: [
      'Select a video file (MP4, MOV, MKV, AVI, WebM)',
      'Choose the target duration',
      'Pick an output folder',
      'Click "Loop Video"'
    ],
    tip: 'Works best with clips that have a seamless start/end. The loop uses stream copy so it\'s very fast.'
  },
  {
    icon: <Merge size={20} />,
    title: 'Video + Audio Merge',
    description:
      'Browse separate folders of video and audio files, then merge a selected pair together. The video loops to match the audio length. Ideal for matching music tracks to video backgrounds.',
    steps: [
      'Click "Browse Folder" on the left panel and select a folder with video files',
      'Click a video from the list to select it',
      'Do the same on the right panel for audio files',
      'Pick an output folder and click "Merge Video + Audio"'
    ],
    tip: 'The video automatically loops if the audio is longer.'
  },
  {
    icon: <Smartphone size={20} />,
    title: 'YouTube Shorts Creator',
    description:
      'Convert a standard widescreen (16:9) video into vertical 9:16 format (1080x1920) for YouTube Shorts, TikTok, or Instagram Reels. Two modes available:',
    steps: [
      'Select a widescreen video',
      'Set the start and end time for the clip (format: SS, MM:SS, or HH:MM:SS)',
      'Choose "Center Crop" (static center cut) or "Smooth Pan" (camera moves across the frame)',
      'If using pan, pick left-to-right or right-to-left direction',
      'Pick an output folder and click "Create Short"'
    ],
    tip: 'Center crop is best for talking-head content. Smooth pan works great for landscape shots or gameplay.'
  },
  {
    icon: <Music size={20} />,
    title: 'Multi-Audio Compiler',
    description:
      'Combine multiple audio files into one continuous track with smooth crossfade transitions, then pair it with a visual background (image or video) to create the final video.',
    steps: [
      'Click "Add" to select audio files (you can add multiple at once)',
      'Drag to reorder the tracks in the order you want them played',
      'Adjust the crossfade duration slider (overlap between tracks)',
      'Choose a visual background (image will be looped, video will be looped to match)',
      'Pick an output folder and click "Compile Video"'
    ],
    tip: 'The crossfade creates a smooth blend between tracks. Set to 0.5s for a quick mix or up to 5s for a gradual transition.'
  },
  {
    icon: <Settings size={20} />,
    title: 'Settings & Themes',
    description:
      'Customize the look of DanthosLabs. Choose from 5 built-in themes or create your own custom theme with full control over every color.',
    steps: [
      'Go to the Settings tab in the sidebar',
      'Click any theme card to switch instantly',
      'Scroll down to the Custom Theme Editor to create your own',
      'Pick colors for each element and click "Save Theme"'
    ],
    tip: 'Your theme choice and custom themes are saved automatically and persist between sessions.'
  }
]

export function Guide() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            DS
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Welcome to DanthosLabs
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Video Suite v2.0
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick start */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="space-y-3">
              <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                Quick Start
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  { icon: <FolderOpen size={14} />, text: 'Select your input files using the file pickers' },
                  { icon: <FolderOpen size={14} />, text: 'Choose an output folder where results will be saved' },
                  { icon: <ArrowRight size={14} />, text: 'Click the action button and watch the progress bar' },
                  { icon: <Zap size={14} />, text: 'Done! Click the output path to open the folder' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] pt-1" style={{ color: 'var(--text-dim)' }}>
                FFmpeg handles all the processing under the hood. Every tool in the sidebar is a different video operation.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--text-dim)' }}>
          Tools Overview
        </h2>
      </motion.div>

      {/* Feature cards */}
      {features.map((feature, i) => (
        <FeatureCard key={i} {...feature} index={i + 2} />
      ))}
    </div>
  )
}
