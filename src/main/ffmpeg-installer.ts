import { app } from 'electron'
import { createWriteStream, copyFileSync, unlinkSync, existsSync, mkdirSync, readdirSync, rmSync, chmodSync } from 'fs'
import { join } from 'path'
import { pipeline } from 'stream/promises'
import { execFile } from 'child_process'
import https from 'https'
import http from 'http'

type ProgressFn = (stage: string, percent: number) => void

// Where we store the downloaded FFmpeg binaries
export function getFFmpegInstallDir(): string {
  return join(app.getPath('userData'), 'ffmpeg')
}

/**
 * Download URLs for static FFmpeg builds per platform.
 * These are well-known, maintained, static builds.
 *
 * Windows: gyan.dev essentials build (widely used, reliable)
 * macOS:   evermeet.cx (the standard for Mac static FFmpeg)
 * Linux:   BtbN GitHub builds (the standard for Linux static FFmpeg)
 */
function getDownloadUrl(): { ffmpeg: string; ffprobe: string; type: 'zip' | 'tar' | 'direct' } {
  switch (process.platform) {
    case 'win32':
      return {
        ffmpeg: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
        ffprobe: '', // included in the zip
        type: 'zip'
      }
    case 'darwin':
      return {
        ffmpeg: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip',
        ffprobe: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip',
        type: 'direct'
      }
    default: // linux
      return {
        ffmpeg: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
        ffprobe: '', // included in the tar
        type: 'tar'
      }
  }
}

/**
 * Follow redirects and download a URL to a file, reporting progress.
 */
function downloadFile(
  url: string,
  destPath: string,
  onProgress: (downloaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doRequest = (reqUrl: string, redirectCount: number) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'))
        return
      }

      const proto = reqUrl.startsWith('https') ? https : http
      proto.get(reqUrl, { headers: { 'User-Agent': 'DanthosStudio/2.0' } }, (res) => {
        // Follow redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doRequest(res.headers.location, redirectCount + 1)
          return
        }

        if (res.statusCode !== 200) {
          // Consume the response to free memory
          res.resume()
          reject(new Error(`Download failed with status ${res.statusCode}`))
          return
        }

        const total = parseInt(res.headers['content-length'] || '0', 10)
        let downloaded = 0

        const file = createWriteStream(destPath)
        res.on('data', (chunk: Buffer) => {
          downloaded += chunk.length
          onProgress(downloaded, total)
        })

        pipeline(res, file).then(resolve).catch(reject)
      }).on('error', reject)
    }

    doRequest(url, 0)
  })
}

/**
 * Extract a .zip file using the system tools.
 * Windows: PowerShell Expand-Archive
 * macOS/Linux: unzip command
 */
function extractZip(zipPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      // PowerShell extraction
      execFile(
        'powershell.exe',
        [
          '-NoProfile', '-Command',
          `Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force`
        ],
        { windowsHide: true, timeout: 120000 },
        (err) => (err ? reject(err) : resolve())
      )
    } else {
      execFile('unzip', ['-o', zipPath, '-d', destDir], { timeout: 120000 }, (err) => {
        if (err) reject(err)
        else resolve()
      })
    }
  })
}

/**
 * Extract a .tar.xz file (Linux).
 */
function extractTarXz(tarPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('tar', ['xf', tarPath, '-C', destDir], { timeout: 120000 }, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

/**
 * Recursively find a file by name in a directory tree.
 */
function findFileRecursive(dir: string, filename: string): string | null {
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) {
        return fullPath
      }
      if (entry.isDirectory()) {
        const found = findFileRecursive(fullPath, filename)
        if (found) return found
      }
    }
  } catch {
    // ignore permission errors etc
  }
  return null
}

/**
 * Download and install FFmpeg + FFprobe for the current platform.
 * Returns the install directory path on success.
 */
export async function installFFmpeg(onProgress: ProgressFn): Promise<string> {
  const installDir = getFFmpegInstallDir()
  const tempDir = join(app.getPath('temp'), 'danthos-ffmpeg-install')

  // Clean temp
  mkdirSync(tempDir, { recursive: true })
  mkdirSync(installDir, { recursive: true })

  const isWin = process.platform === 'win32'
  const urls = getDownloadUrl()

  try {
    // --- Download ---
    onProgress('Downloading FFmpeg...', 5)

    const archiveName = isWin ? 'ffmpeg.zip' : process.platform === 'darwin' ? 'ffmpeg.zip' : 'ffmpeg.tar.xz'
    const archivePath = join(tempDir, archiveName)

    await downloadFile(urls.ffmpeg, archivePath, (downloaded, total) => {
      const pct = total > 0 ? Math.min(45, Math.round((downloaded / total) * 45) + 5) : 20
      const mb = (downloaded / 1024 / 1024).toFixed(1)
      const totalMb = total > 0 ? (total / 1024 / 1024).toFixed(0) : '?'
      onProgress(`Downloading FFmpeg... ${mb} / ${totalMb} MB`, pct)
    })

    // Download ffprobe separately on macOS
    if (process.platform === 'darwin' && urls.ffprobe) {
      onProgress('Downloading FFprobe...', 50)
      const probePath = join(tempDir, 'ffprobe.zip')
      await downloadFile(urls.ffprobe, probePath, (downloaded, total) => {
        const pct = total > 0 ? Math.min(65, Math.round((downloaded / total) * 15) + 50) : 55
        onProgress(`Downloading FFprobe...`, pct)
      })

      // Extract ffprobe
      onProgress('Extracting FFprobe...', 65)
      await extractZip(probePath, tempDir)
    }

    // --- Extract ---
    // Use 70 on macOS since FFprobe download+extract goes to 65
    const extractPct = process.platform === 'darwin' ? 70 : 50
    onProgress('Extracting FFmpeg...', extractPct)

    if (urls.type === 'zip' || urls.type === 'direct') {
      await extractZip(archivePath, tempDir)
    } else {
      await extractTarXz(archivePath, tempDir)
    }

    onProgress('Installing...', 80)

    // --- Find and move binaries ---
    const ffmpegExe = isWin ? 'ffmpeg.exe' : 'ffmpeg'
    const ffprobeExe = isWin ? 'ffprobe.exe' : 'ffprobe'

    const foundFFmpeg = findFileRecursive(tempDir, ffmpegExe)
    const foundFFprobe = findFileRecursive(tempDir, ffprobeExe)

    if (!foundFFmpeg) {
      throw new Error('Could not find ffmpeg binary in downloaded archive')
    }

    // Copy to install directory (copyFileSync works across filesystems unlike renameSync)
    const destFFmpeg = join(installDir, ffmpegExe)
    const destFFprobe = join(installDir, ffprobeExe)

    copyFileSync(foundFFmpeg, destFFmpeg)
    if (foundFFprobe) {
      copyFileSync(foundFFprobe, destFFprobe)
    }

    // Make executable on Unix
    if (!isWin) {
      chmodSync(destFFmpeg, 0o755)
      if (existsSync(destFFprobe)) chmodSync(destFFprobe, 0o755)
    }

    onProgress('FFmpeg installed successfully!', 100)

    return installDir
  } finally {
    // Clean up temp dir (best effort)
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
}
