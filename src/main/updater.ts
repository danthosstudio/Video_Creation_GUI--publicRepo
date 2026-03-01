import { autoUpdater } from 'electron-updater'
import { BrowserWindow, app } from 'electron'

let mainWin: BrowserWindow | null = null

type UpdateStatus =
  | { event: 'checking' }
  | { event: 'available'; version: string; releaseNotes?: string }
  | { event: 'not-available'; version: string }
  | { event: 'downloading'; percent: number; transferred: number; total: number }
  | { event: 'downloaded'; version: string }
  | { event: 'error'; message: string }

function send(status: UpdateStatus) {
  mainWin?.webContents.send('updater:status', status)
}

export function initUpdater(window: BrowserWindow): void {
  mainWin = window

  // Don't auto-download — let the user click the button
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    send({ event: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    send({
      event: 'available',
      version: info.version,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    send({ event: 'not-available', version: info.version })
  })

  autoUpdater.on('download-progress', (progress) => {
    send({
      event: 'downloading',
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    send({ event: 'downloaded', version: info.version })
  })

  autoUpdater.on('error', (err) => {
    send({ event: 'error', message: err.message || 'Update check failed' })
  })
}

export async function checkForUpdates(): Promise<void> {
  // In dev mode, autoUpdater won't work — return gracefully
  if (!app.isPackaged) {
    send({ event: 'error', message: 'Updates are not available in development mode' })
    return
  }
  await autoUpdater.checkForUpdates()
}

export async function downloadUpdate(): Promise<void> {
  await autoUpdater.downloadUpdate()
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall(false, true)
}

export function getAppVersion(): string {
  return app.getVersion()
}
