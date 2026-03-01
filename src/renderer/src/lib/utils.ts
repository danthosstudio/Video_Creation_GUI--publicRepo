export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Join directory and filename using the OS-appropriate separator */
export function joinPath(dir: string, filename: string): string {
  const sep = dir.includes('\\') ? '\\' : '/'
  return `${dir}${sep}${filename}`
}

export function basename(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('/').pop() || filePath
}

export function stem(filePath: string): string {
  const name = basename(filePath)
  const lastDot = name.lastIndexOf('.')
  return lastDot > 0 ? name.substring(0, lastDot) : name
}

export function getReadableDuration(seconds: number): string {
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

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
export const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v']
export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg']

export const IMAGE_FILTERS = [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif', 'webp'] }]
export const VIDEO_FILTERS = [{ name: 'Videos', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'] }]
export const AUDIO_FILTERS = [{ name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'] }]
export const MEDIA_FILTERS = [
  { name: 'Media', extensions: ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'mkv', 'avi'] }
]
