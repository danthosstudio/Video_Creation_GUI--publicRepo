import { useState } from 'react'
import { ImagePlay, Image, Music } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { FileSelector } from '@/components/ui/FileSelector'
import { OutputSelector } from '@/components/ui/OutputSelector'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AnimatedButton } from '@/components/ui/AnimatedButton'
import { showSuccess, showError } from '@/components/ui/Toast'
import { useFFmpeg } from '@/hooks/useFFmpeg'
import { IMAGE_FILTERS, AUDIO_FILTERS, stem, joinPath } from '@/lib/utils'

export function PictureAudio() {
  const [imageFile, setImageFile] = useState<string[]>([])
  const [audioFile, setAudioFile] = useState<string[]>([])
  const [outputDir, setOutputDir] = useState('')
  const ffmpeg = useFFmpeg()

  const handleProcess = async () => {
    if (imageFile.length === 0) return showError('Please select an image file')
    if (audioFile.length === 0) return showError('Please select an audio file')
    if (!outputDir) return showError('Please select an output folder')

    const imagePath = imageFile[0]
    const audioPath = audioFile[0]
    const outputPath = joinPath(outputDir, `${stem(imagePath)}_${stem(audioPath)}.mp4`)

    const result = await ffmpeg.execute(() =>
      window.api.pictureAudioToVideo({ imagePath, audioPath, outputPath })
    )
    if (!result) return
    if (result.success) showSuccess(result.message)
    else showError(result.message)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Picture + Audio to Video
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Create video from image with audio (duration matches audio)
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

          <FileSelector
            label="Select Audio"
            filters={AUDIO_FILTERS}
            value={audioFile}
            onChange={setAudioFile}
            icon={<Music size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
          />

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
            disabled={imageFile.length === 0 || audioFile.length === 0}
            className="w-full"
            icon={<ImagePlay size={18} />}
          >
            Create Video
          </AnimatedButton>
        </CardContent>
      </Card>
    </div>
  )
}
