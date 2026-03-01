import { execFile } from 'child_process'
import { mkdtempSync, writeFileSync, rmSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { app } from 'electron'
import { getFFmpegInstallDir } from './ffmpeg-installer'

type ProgressCallback = (status: string, progress: number) => void
type Result = { success: boolean; message: string }

// ============================================================================
// FFMPEG RESOLUTION - searches auto-installed, bundled, PATH, and common paths
// ============================================================================

let cachedFFmpegPath: string | null = null
let cachedFFprobePath: string | null = null

/** Clear cached paths (call after installing FFmpeg so it re-discovers) */
export function clearFFmpegCache(): void {
  cachedFFmpegPath = null
  cachedFFprobePath = null
}

function findBinary(name: string): string {
  const isWin = process.platform === 'win32'
  const exeName = isWin ? `${name}.exe` : name

  // 1. Check our auto-installed location (app userData/ffmpeg/)
  const autoInstalled = join(getFFmpegInstallDir(), exeName)
  if (existsSync(autoInstalled)) return autoInstalled

  // 2. Check bundled in app resources (for packaged builds)
  if (app.isPackaged) {
    const bundled = join(process.resourcesPath, 'ffmpeg', exeName)
    if (existsSync(bundled)) return bundled
  }

  // 3. Check common install locations
  const commonPaths: string[] = isWin
    ? [
        join(process.env.LOCALAPPDATA || '', 'ffmpeg', 'bin', exeName),
        join(process.env.PROGRAMFILES || '', 'ffmpeg', 'bin', exeName),
        join('C:\\ffmpeg\\bin', exeName),
        join('C:\\tools\\ffmpeg\\bin', exeName)
      ]
    : [
        `/usr/local/bin/${name}`,
        `/opt/homebrew/bin/${name}`,
        `/usr/bin/${name}`
      ]

  for (const p of commonPaths) {
    if (existsSync(p)) return p
  }

  // 4. Fall back to PATH (will work if user has it installed globally)
  return name
}

function getFFmpegPath(): string {
  if (!cachedFFmpegPath) cachedFFmpegPath = findBinary('ffmpeg')
  return cachedFFmpegPath
}

function getFFprobePath(): string {
  if (!cachedFFprobePath) cachedFFprobePath = findBinary('ffprobe')
  return cachedFFprobePath
}

/**
 * Check if FFmpeg is available and working.
 * Returns { available: true, version } or { available: false, error }.
 */
export async function checkFFmpeg(): Promise<{ available: boolean; version?: string; error?: string; path?: string }> {
  return new Promise((resolve) => {
    const ffmpegPath = getFFmpegPath()
    execFile(ffmpegPath, ['-version'], { windowsHide: true, timeout: 5000 }, (error, stdout) => {
      if (error) {
        resolve({
          available: false,
          error: 'FFmpeg not found. Please install FFmpeg and make sure it is in your system PATH.',
          path: ffmpegPath
        })
      } else {
        const versionMatch = stdout.match(/ffmpeg version (\S+)/)
        resolve({
          available: true,
          version: versionMatch ? versionMatch[1] : 'unknown',
          path: ffmpegPath
        })
      }
    })
  })
}

function runFFmpeg(args: string[]): Promise<{ success: boolean; output: string }> {
  // Prepend -loglevel error as a global option (before any -i inputs)
  const fullArgs = ['-loglevel', 'error', ...args]
  return new Promise((resolve) => {
    execFile(getFFmpegPath(), fullArgs, { windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr || error.message })
      } else {
        resolve({ success: true, output: stdout })
      }
    })
  })
}

function runFFprobe(args: string[]): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    execFile(getFFprobePath(), args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr || error.message })
      } else {
        resolve({ success: true, output: stdout.trim() })
      }
    })
  })
}

async function getMediaDuration(filePath: string): Promise<number | null> {
  const result = await runFFprobe([
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', filePath
  ])
  if (result.success) {
    const dur = parseFloat(result.output)
    return isNaN(dur) ? null : dur
  }
  return null
}

function getReadableDuration(seconds: number): string {
  if (seconds >= 3600) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return mins > 0 ? `${hrs}hr${mins}min` : `${hrs}hr`
  } else if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const remainder = Math.round(seconds % 60)
    return remainder > 0 ? `${mins}min${remainder}s` : `${mins}min`
  }
  return `${Math.round(seconds)}s`
}

function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length === 1) return parseFloat(parts[0]) || 0
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseFloat(parts[1])
  if (parts.length === 3) return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
  return 0
}

function makeTempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), `danthos-${prefix}-`))
}

function cleanupTempDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // Ignore cleanup errors
  }
}

function basename(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('/').pop() || filePath
}

function stem(filePath: string): string {
  const name = basename(filePath)
  const lastDot = name.lastIndexOf('.')
  return lastDot > 0 ? name.substring(0, lastDot) : name
}

// ============================================================================
// VIDEO PROCESSING METHODS
// ============================================================================

const SEGMENT_SECONDS = 10
const FRAMERATE = '1'
const AUDIO_BITRATE = '320k'
const VIDEO_CRF = '18'

export async function pictureToVideo(
  imagePath: string,
  outputPath: string,
  durationSeconds: number,
  onProgress?: ProgressCallback
): Promise<Result> {
  const tempDir = makeTempDir('pic2vid')
  const tempSegment = join(tempDir, 'segment.mp4')
  const concatFile = join(tempDir, 'concat.txt')

  try {
    onProgress?.('Creating video segment...', 10)

    let result = await runFFmpeg([
      '-y', '-loop', '1', '-framerate', FRAMERATE,
      '-i', imagePath, '-c:v', 'libx264',
      '-t', String(SEGMENT_SECONDS), '-pix_fmt', 'yuv420p',
      '-r', FRAMERATE, '-preset', 'ultrafast',
      '-crf', VIDEO_CRF,
      '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
      tempSegment
    ])

    if (!result.success) return { success: false, message: `Failed to create segment: ${result.output}` }

    onProgress?.('Building concat list...', 30)

    const loops = Math.floor(durationSeconds / SEGMENT_SECONDS) + 1
    const lines = Array(loops).fill(`file '${tempSegment.replace(/\\/g, '/')}'`).join('\n')
    writeFileSync(concatFile, lines)

    onProgress?.('Concatenating segments...', 60)

    result = await runFFmpeg([
      '-y', '-f', 'concat', '-safe', '0',
      '-i', concatFile, '-t', String(durationSeconds),
      '-c', 'copy', outputPath
    ])

    onProgress?.('Complete!', 100)

    return result.success
      ? { success: true, message: `Created: ${basename(outputPath)}` }
      : { success: false, message: `Failed: ${result.output}` }
  } finally {
    cleanupTempDir(tempDir)
  }
}

export async function pictureAudioToVideo(
  imagePath: string,
  audioPath: string,
  outputPath: string,
  onProgress?: ProgressCallback
): Promise<Result> {
  const audioDuration = await getMediaDuration(audioPath)
  if (audioDuration === null) return { success: false, message: 'Could not determine audio duration' }

  const durationSeconds = Math.floor(audioDuration) + 1
  const tempDir = makeTempDir('audpic2vid')
  const tempSegment = join(tempDir, 'segment.mp4')
  const concatFile = join(tempDir, 'concat.txt')
  const tempLooped = join(tempDir, 'looped.mp4')

  try {
    onProgress?.('Creating video segment...', 10)

    let result = await runFFmpeg([
      '-y', '-loop', '1', '-framerate', FRAMERATE,
      '-i', imagePath, '-c:v', 'libx264',
      '-t', String(SEGMENT_SECONDS), '-pix_fmt', 'yuv420p',
      '-r', FRAMERATE, '-preset', 'ultrafast',
      '-crf', VIDEO_CRF,
      '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
      tempSegment
    ])

    if (!result.success) return { success: false, message: `Failed to create segment: ${result.output}` }

    onProgress?.('Building concat list...', 25)

    const loops = Math.floor(durationSeconds / SEGMENT_SECONDS) + 1
    const lines = Array(loops).fill(`file '${tempSegment.replace(/\\/g, '/')}'`).join('\n')
    writeFileSync(concatFile, lines)

    onProgress?.('Concatenating segments...', 50)

    result = await runFFmpeg([
      '-y', '-f', 'concat', '-safe', '0',
      '-i', concatFile, '-c', 'copy',
      tempLooped
    ])

    if (!result.success) return { success: false, message: `Failed to concatenate: ${result.output}` }

    onProgress?.('Adding audio...', 80)

    result = await runFFmpeg([
      '-y', '-i', tempLooped, '-i', audioPath,
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', AUDIO_BITRATE,
      '-shortest', '-map', '0:v:0', '-map', '1:a:0',
      outputPath
    ])

    onProgress?.('Complete!', 100)

    return result.success
      ? { success: true, message: `Created: ${basename(outputPath)}` }
      : { success: false, message: `Failed: ${result.output}` }
  } finally {
    cleanupTempDir(tempDir)
  }
}

export async function loopVideo(
  videoPath: string,
  outputPath: string,
  durationSeconds: number,
  onProgress?: ProgressCallback
): Promise<Result> {
  onProgress?.('Looping video...', 30)

  const result = await runFFmpeg([
    '-y', '-stream_loop', '-1', '-i', videoPath,
    '-t', String(durationSeconds), '-c', 'copy',
    outputPath  ])

  onProgress?.('Complete!', 100)

  return result.success
    ? { success: true, message: `Created: ${basename(outputPath)}` }
    : { success: false, message: `Failed: ${result.output}` }
}

export async function videoAudioMerge(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  onProgress?: ProgressCallback
): Promise<Result> {
  onProgress?.('Merging video and audio...', 30)

  const result = await runFFmpeg([
    '-y', '-stream_loop', '-1', '-i', videoPath,
    '-i', audioPath, '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', AUDIO_BITRATE,
    '-shortest', '-map', '0:v:0', '-map', '1:a:0',
    outputPath  ])

  onProgress?.('Complete!', 100)

  return result.success
    ? { success: true, message: `Created: ${basename(outputPath)}` }
    : { success: false, message: `Failed: ${result.output}` }
}

export async function youtubeShortsCenter(
  videoPath: string,
  outputPath: string,
  startTime: string,
  endTime: string,
  onProgress?: ProgressCallback
): Promise<Result> {
  onProgress?.('Creating YouTube Short (center crop)...', 30)

  const vf = 'crop=min(iw\\,ih*9/16):min(ih\\,iw*16/9),scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1'

  const result = await runFFmpeg([
    '-y', '-ss', startTime, '-to', endTime, '-i', videoPath,
    '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '256k',
    '-preset', 'medium', '-crf', '20',
    '-vf', vf, '-r', '30', outputPath  ])

  onProgress?.('Complete!', 100)

  return result.success
    ? { success: true, message: `Created: ${basename(outputPath)}` }
    : { success: false, message: `Failed: ${result.output}` }
}

export async function youtubeShortsPan(
  videoPath: string,
  outputPath: string,
  startTime: string,
  endTime: string,
  direction: 'left_to_right' | 'right_to_left',
  onProgress?: ProgressCallback
): Promise<Result> {
  const startSecs = timeToSeconds(startTime)
  const endSecs = timeToSeconds(endTime)
  const duration = endSecs - startSecs

  onProgress?.('Creating YouTube Short (smooth pan)...', 30)

  const vf = direction === 'left_to_right'
    ? `fps=60,crop=ih*9/16:ih:(iw-ih*9/16)*t/${duration}:0,scale=1080:1920,setsar=1`
    : `fps=60,crop=ih*9/16:ih:(iw-ih*9/16)*(1-t/${duration}):0,scale=1080:1920,setsar=1`

  const result = await runFFmpeg([
    '-y', '-ss', startTime, '-t', String(duration), '-i', videoPath,
    '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-c:a', 'aac', '-b:a', '192k', outputPath  ])

  onProgress?.('Complete!', 100)

  return result.success
    ? { success: true, message: `Created: ${basename(outputPath)}` }
    : { success: false, message: `Failed: ${result.output}` }
}

export async function multiAudioCompile(
  audioFiles: string[],
  visualPath: string,
  outputPath: string,
  crossfadeDuration: number,
  visualIsVideo: boolean,
  onProgress?: ProgressCallback
): Promise<Result> {
  if (audioFiles.length < 1) return { success: false, message: 'At least one audio file required' }

  const tempDir = makeTempDir('multiaudio')
  const mergedAudio = join(tempDir, 'merged_audio.aac')

  try {
    onProgress?.('Analyzing audio files...', 5)

    const durations: number[] = []
    for (const af of audioFiles) {
      const dur = await getMediaDuration(af)
      if (dur === null) return { success: false, message: `Could not get duration of ${basename(af)}` }
      durations.push(dur)
    }

    const totalDuration = durations.reduce((a, b) => a + b, 0) - crossfadeDuration * (audioFiles.length - 1)

    onProgress?.('Merging audio with crossfades...', 20)

    let result: { success: boolean; output: string }

    if (audioFiles.length === 1) {
      result = await runFFmpeg([
        '-y', '-i', audioFiles[0],
        '-c:a', 'aac', '-b:a', AUDIO_BITRATE,
        mergedAudio      ])
    } else {
      const inputArgs: string[] = []
      for (const af of audioFiles) {
        inputArgs.push('-i', af)
      }

      const filterParts: string[] = []
      let currentLabel = '0:a'

      for (let i = 1; i < audioFiles.length; i++) {
        const nextLabel = i < audioFiles.length - 1 ? `a${i}` : 'aout'
        filterParts.push(
          `[${currentLabel}][${i}:a]acrossfade=d=${crossfadeDuration}:c1=tri:c2=tri[${nextLabel}]`
        )
        currentLabel = nextLabel
      }

      const filterComplex = filterParts.join(';')

      result = await runFFmpeg([
        '-y', ...inputArgs,
        '-filter_complex', filterComplex,
        '-map', '[aout]',
        '-c:a', 'aac', '-b:a', AUDIO_BITRATE,
        mergedAudio      ])
    }

    if (!result.success) return { success: false, message: `Failed to merge audio: ${result.output}` }

    onProgress?.('Creating visual track...', 50)

    if (visualIsVideo) {
      onProgress?.('Looping video to match audio...', 60)

      result = await runFFmpeg([
        '-y', '-stream_loop', '-1', '-i', visualPath,
        '-i', mergedAudio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', AUDIO_BITRATE,
        '-shortest', '-map', '0:v:0', '-map', '1:a:0',
        outputPath      ])
    } else {
      const tempSegment = join(tempDir, 'segment.mp4')
      const concatFile = join(tempDir, 'concat.txt')
      const tempLooped = join(tempDir, 'looped.mp4')

      result = await runFFmpeg([
        '-y', '-loop', '1', '-framerate', FRAMERATE,
        '-i', visualPath, '-c:v', 'libx264',
        '-t', String(SEGMENT_SECONDS), '-pix_fmt', 'yuv420p',
        '-r', FRAMERATE, '-preset', 'ultrafast',
        '-crf', VIDEO_CRF,
        '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
        tempSegment      ])

      if (!result.success) return { success: false, message: `Failed to create video segment: ${result.output}` }

      onProgress?.('Concatenating video segments...', 70)

      const loops = Math.floor(totalDuration / SEGMENT_SECONDS) + 2
      const lines = Array(loops).fill(`file '${tempSegment.replace(/\\/g, '/')}'`).join('\n')
      writeFileSync(concatFile, lines)

      result = await runFFmpeg([
        '-y', '-f', 'concat', '-safe', '0',
        '-i', concatFile, '-c', 'copy',
        tempLooped      ])

      if (!result.success) return { success: false, message: `Failed to concatenate video: ${result.output}` }

      onProgress?.('Adding audio to video...', 85)

      result = await runFFmpeg([
        '-y', '-i', tempLooped, '-i', mergedAudio,
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', AUDIO_BITRATE,
        '-shortest', '-map', '0:v:0', '-map', '1:a:0',
        outputPath      ])
    }

    onProgress?.('Complete!', 100)

    return result.success
      ? { success: true, message: `Created: ${basename(outputPath)}` }
      : { success: false, message: `Failed: ${result.output}` }
  } finally {
    cleanupTempDir(tempDir)
  }
}

// Utility exports
export { getReadableDuration, getMediaDuration, basename as getBasename, stem as getStem }

export function listFilesInDirectory(dirPath: string, extensions: string[]): string[] {
  try {
    const files = readdirSync(dirPath)
    const lowerExts = extensions.map((e) => e.toLowerCase())
    return files
      .filter((f) => lowerExts.some((ext) => f.toLowerCase().endsWith(ext)))
      .sort()
  } catch {
    return []
  }
}
