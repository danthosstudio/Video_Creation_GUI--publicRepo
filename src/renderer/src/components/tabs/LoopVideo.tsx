import { useState } from 'react'
import { Repeat, Film } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { FileSelector } from '@/components/ui/FileSelector'
import { OutputSelector } from '@/components/ui/OutputSelector'
import { DurationPicker } from '@/components/ui/DurationPicker'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { showSuccess, showError } from '@/components/ui/Toast'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { VIDEO_FILTERS, stem, getReadableDuration, joinPath } from '@/lib/utils'

const loopDurationOptions = [
  { label: '1 Hour', seconds: 3600 },
  { label: '2 Hours', seconds: 7200 },
  { label: '3 Hours', seconds: 10800 },
  { label: '4 Hours', seconds: 14400 },
  { label: 'Custom', seconds: -1 }
]

export function LoopVideo() {
  const [videoFile, setVideoFile] = useState<string[]>([])
  const [duration, setDuration] = useState(7200)
  const [outputDir, setOutputDir] = useState('')
  const ffmpeg = useFFmpeg()

  const handleProcess = async () => {
    if (videoFile.length === 0) return showError('Please select a video file')
    if (!outputDir) return showError('Please select an output folder')

    const videoPath = videoFile[0]
    const durName = getReadableDuration(duration)
    const outputPath = joinPath(outputDir, `${stem(videoPath)}_loop_${durName}.mp4`)

    const result = await ffmpeg.execute(() =>
      window.api.loopVideo({ videoPath, outputPath, durationSeconds: duration })
    )
    if (!result) return
    if (result.success) showSuccess(result.message)
    else showError(result.message)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Loop Video
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Loop a video to target duration (no audio)
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

          <DurationPicker value={duration} onChange={setDuration} options={loopDurationOptions} />

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
            icon={<Repeat size={18} />}
          >
            Loop Video
          </AnimatedButton>
        </CardContent>
      </Card>
    </div>
  )
}
