import { useState } from 'react'
import { Image } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { FileSelector } from '@/components/ui/FileSelector'
import { OutputSelector } from '@/components/ui/OutputSelector'
import { DurationPicker } from '@/components/ui/DurationPicker'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { showSuccess, showError } from '@/components/ui/Toast'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { IMAGE_FILTERS, stem, getReadableDuration, joinPath } from '@/lib/utils'

export function PictureToVideo() {
  const [imageFile, setImageFile] = useState<string[]>([])
  const [duration, setDuration] = useState(3600)
  const [outputDir, setOutputDir] = useState('')
  const ffmpeg = useFFmpeg()

  const handleProcess = async () => {
    if (imageFile.length === 0) return showError('Please select an image file')
    if (!outputDir) return showError('Please select an output folder')

    const imagePath = imageFile[0]
    const durName = getReadableDuration(duration)
    const outputPath = joinPath(outputDir, `${stem(imagePath)}_${durName}.mp4`)

    const result = await ffmpeg.execute(() =>
      window.api.pictureToVideo({ imagePath, outputPath, durationSeconds: duration })
    )
    if (!result) return
    if (result.success) showSuccess(result.message)
    else showError(result.message)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Picture to Video
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Create a video from a static image (no audio)
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <FileSelector
            label="Select Image"
            filters={IMAGE_FILTERS}
            value={imageFile}
            onChange={setImageFile}
            icon={<Image size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
          />

          <DurationPicker value={duration} onChange={setDuration} />

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
            disabled={imageFile.length === 0}
            className="w-full"
            icon={<Image size={18} />}
          >
            Create Video
          </AnimatedButton>
        </CardContent>
      </Card>
    </div>
  )
}
