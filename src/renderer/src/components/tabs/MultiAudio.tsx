import { useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import { Music, Plus, Trash2, X, GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { FileSelector } from '@/components/ui/FileSelector'
import { OutputSelector } from '@/components/ui/OutputSelector'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { Slider } from '@/components/ui/Slider'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { showSuccess, showError } from '@/components/ui/Toast'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { AUDIO_FILTERS, MEDIA_FILTERS, basename, joinPath } from '@/lib/utils'

export function MultiAudio() {
  // Use objects with unique IDs to avoid duplicate key issues when same file is added multiple times
  const [audioItems, setAudioItems] = useState<{ id: string; path: string }[]>([])
  const [crossfade, setCrossfade] = useState(2.0)
  const [visualType, setVisualType] = useState('image')
  const [visualFile, setVisualFile] = useState<string[]>([])
  const [outputDir, setOutputDir] = useState('')
  const ffmpeg = useFFmpeg()

  const audioFiles = audioItems.map((item) => item.path)

  const handleAddAudio = async () => {
    const files = await window.api.openFiles(AUDIO_FILTERS)
    if (files) {
      const newItems = files.map((f) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, path: f }))
      setAudioItems((prev) => [...prev, ...newItems])
    }
  }

  const handleRemove = (index: number) => {
    setAudioItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClear = () => setAudioItems([])

  const handleProcess = async () => {
    if (audioFiles.length === 0) return showError('Please add at least one audio file')
    if (visualFile.length === 0) return showError('Please select a visual (image or video)')
    if (!outputDir) return showError('Please select an output folder')

    const outputPath = joinPath(outputDir, `compiled_${audioFiles.length}tracks.mp4`)

    const result = await ffmpeg.execute(() =>
      window.api.multiAudioCompile({
        audioFiles,
        visualPath: visualFile[0],
        outputPath,
        crossfadeDuration: crossfade,
        visualIsVideo: visualType === 'video'
      })
    )
    if (!result) return
    if (result.success) showSuccess(result.message)
    else showError(result.message)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Multi-Audio Compiler
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Combine multiple audio files with crossfade transitions
        </p>
      </div>

      {/* Audio files list */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Audio Files ({audioFiles.length})
            </label>
            <div className="flex gap-2">
              <AnimatedButton size="sm" onClick={handleAddAudio} icon={<Plus size={14} />}>
                Add
              </AnimatedButton>
              {audioFiles.length > 0 && (
                <AnimatedButton size="sm" variant="ghost" onClick={handleClear} icon={<Trash2 size={14} />}>
                  Clear
                </AnimatedButton>
              )}
            </div>
          </div>

          <div
            className="rounded-xl border min-h-[120px] max-h-[240px] overflow-y-auto"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            {audioFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Music size={24} style={{ color: 'var(--text-dim)' }} />
                <span className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
                  Click "Add" to select audio files
                </span>
              </div>
            ) : (
              <Reorder.Group
                values={audioItems}
                onReorder={setAudioItems}
                className="p-1.5 space-y-0.5"
              >
                {audioItems.map((item, i) => (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <GripVertical size={12} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                    <span
                      className="text-xs font-mono w-5 text-center shrink-0"
                      style={{ color: 'var(--accent)' }}
                    >
                      {i + 1}
                    </span>
                    <Music size={12} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                    <span className="text-xs truncate flex-1" style={{ color: 'var(--text)' }}>
                      {basename(item.path)}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemove(i)}
                      className="p-1 rounded shrink-0"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      <X size={12} />
                    </motion.button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <Slider
            label="Crossfade Duration"
            value={crossfade}
            min={0.5}
            max={5}
            step={0.5}
            unit="s"
            onChange={setCrossfade}
          />

          <RadioGroup
            label="Visual Background"
            options={[
              { value: 'image', label: 'Image (loops)' },
              { value: 'video', label: 'Video (loops)' }
            ]}
            value={visualType}
            onChange={setVisualType}
          />

          <FileSelector
            label="Select Visual"
            filters={MEDIA_FILTERS}
            value={visualFile}
            onChange={setVisualFile}
          />

          <OutputSelector value={outputDir} onChange={setOutputDir} />
        </CardContent>
      </Card>

      {/* Progress & Action */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <ProgressBar
            progress={ffmpeg.progress}
            status={ffmpeg.status}
            isSuccess={ffmpeg.result?.success}
            isError={ffmpeg.result !== null && !ffmpeg.result.success}
          />

          <AnimatedButton
            size="lg"
            onClick={handleProcess}
            loading={ffmpeg.isProcessing}
            disabled={audioFiles.length === 0 || visualFile.length === 0}
            className="w-full"
            icon={<Music size={18} />}
          >
            Compile Video
          </AnimatedButton>
        </CardContent>
      </Card>
    </div>
  )
}
