import { useState } from 'react'
import { Smartphone, Film } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { FileSelector } from '@/components/ui/FileSelector'
import { OutputSelector } from '@/components/ui/OutputSelector'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { showSuccess, showError } from '@/components/ui/Toast'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { VIDEO_FILTERS, stem, joinPath } from '@/lib/utils'

export function YouTubeShorts() {
  const [videoFile, setVideoFile] = useState<string[]>([])
  const [startTime, setStartTime] = useState('0:00')
  const [endTime, setEndTime] = useState('0:60')
  const [mode, setMode] = useState('center')
  const [panDirection, setPanDirection] = useState('left_to_right')
  const [outputDir, setOutputDir] = useState('')
  const ffmpeg = useFFmpeg()

  const handleProcess = async () => {
    if (videoFile.length === 0) return showError('Please select a video file')
    if (!outputDir) return showError('Please select an output folder')

    const videoPath = videoFile[0]
    const modeSuffix = mode === 'center' ? 'center' : `pan_${panDirection.slice(0, 3)}`
    const outputPath = joinPath(outputDir, `${stem(videoPath)}_short_${modeSuffix}.mp4`)

    const result = await ffmpeg.execute(() => {
      if (mode === 'center') {
        return window.api.youtubeShortsCenter({
          videoPath, outputPath, startTime, endTime
        })
      } else {
        return window.api.youtubeShortsPan({
          videoPath, outputPath, startTime, endTime,
          direction: panDirection as 'left_to_right' | 'right_to_left'
        })
      }
    })
    if (!result) return
    if (result.success) showSuccess(result.message)
    else showError(result.message)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          YouTube Shorts Creator
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Convert video to 9:16 vertical format (1080x1920)
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <FileSelector
            label="Select Video"
            filters={VIDEO_FILTERS}
            value={videoFile}
            onChange={setVideoFile}
            icon={<Film size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
          />

          {/* Time inputs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Clip Times
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Start:</span>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="0:00"
                  className="w-20 text-sm text-center"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>End:</span>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="0:60"
                  className="w-20 text-sm text-center"
                />
              </div>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
              Format: SS, MM:SS, or HH:MM:SS
            </p>
          </div>

          <RadioGroup
            label="Mode"
            options={[
              { value: 'center', label: 'Center Crop', description: 'Crop from center' },
              { value: 'pan', label: 'Smooth Pan', description: 'Panning motion across frame' }
            ]}
            value={mode}
            onChange={setMode}
          />

          {mode === 'pan' && (
            <RadioGroup
              label="Pan Direction"
              options={[
                { value: 'left_to_right', label: 'Left to Right' },
                { value: 'right_to_left', label: 'Right to Left' }
              ]}
              value={panDirection}
              onChange={setPanDirection}
            />
          )}

          <OutputSelector value={outputDir} onChange={setOutputDir} />
        </CardContent>
      </Card>

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
            disabled={videoFile.length === 0}
            className="w-full"
            icon={<Smartphone size={18} />}
          >
            Create Short
          </AnimatedButton>
        </CardContent>
      </Card>
    </div>
  )
}
