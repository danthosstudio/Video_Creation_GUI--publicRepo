import { useState } from 'react'
import { Merge } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { FolderBrowser } from '@/components/ui/FolderBrowser'
import { OutputSelector } from '@/components/ui/OutputSelector'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { showSuccess, showError } from '@/components/ui/Toast'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { VIDEO_EXTENSIONS, AUDIO_EXTENSIONS, stem, joinPath } from '@/lib/utils'

export function VideoAudioMerge() {
  const [videoFile, setVideoFile] = useState<string | null>(null)
  const [audioFile, setAudioFile] = useState<string | null>(null)
  const [outputDir, setOutputDir] = useState('')
  const ffmpeg = useFFmpeg()

  const handleProcess = async () => {
    if (!videoFile) return showError('Please select a video file from the left panel')
    if (!audioFile) return showError('Please select an audio file from the right panel')
    if (!outputDir) return showError('Please select an output folder')

    const outputPath = joinPath(outputDir, `${stem(videoFile)}_${stem(audioFile)}.mp4`)

    const result = await ffmpeg.execute(() =>
      window.api.videoAudioMerge({ videoPath: videoFile, audioPath: audioFile, outputPath })
    )
    if (!result) return
    if (result.success) showSuccess(result.message)
    else showError(result.message)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Video + Audio Merge
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Browse folders and select files to merge
        </p>
      </div>

      {/* Dual folder browsers side by side */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="min-h-[350px]">
          <CardContent className="pt-5 h-full flex flex-col">
            <FolderBrowser
              label="Video Files"
              extensions={VIDEO_EXTENSIONS}
              value={videoFile}
              onSelect={setVideoFile}
            />
          </CardContent>
        </Card>

        <Card className="min-h-[350px]">
          <CardContent className="pt-5 h-full flex flex-col">
            <FolderBrowser
              label="Audio Files"
              extensions={AUDIO_EXTENSIONS}
              value={audioFile}
              onSelect={setAudioFile}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <OutputSelector value={outputDir} onChange={setOutputDir} />

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
            disabled={!videoFile || !audioFile}
            className="w-full"
            icon={<Merge size={18} />}
          >
            Merge Video + Audio
          </AnimatedButton>
        </CardContent>
      </Card>
    </div>
  )
}
