import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import Store from 'electron-store'
import {
  pictureToVideo,
  pictureAudioToVideo,
  loopVideo,
  videoAudioMerge,
  youtubeShortsCenter,
  youtubeShortsPan,
  multiAudioCompile,
  listFilesInDirectory,
  checkFFmpeg,
  clearFFmpegCache
} from './video-processor'
import { installFFmpeg } from './ffmpeg-installer'
import { checkForUpdates, downloadUpdate, installUpdate, getAppVersion } from './updater'

const store = new Store()

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Window controls
  ipcMain.on('window:minimize', () => mainWindow.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow.close())
  ipcMain.handle('window:isMaximized', () => mainWindow.isMaximized())

  // Notify renderer when maximize state changes externally
  mainWindow.on('maximize', () => mainWindow.webContents.send('window:maximize-change', true))
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:maximize-change', false))

  // Dialogs
  ipcMain.handle('dialog:open-file', async (_event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:open-files', async (_event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters
    })
    return result.canceled ? null : result.filePaths
  })

  ipcMain.handle('dialog:open-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:list-files', (_event, dirPath: string, extensions: string[]) => {
    return listFilesInDirectory(dirPath, extensions)
  })

  // FFmpeg health check
  ipcMain.handle('ffmpeg:check', async () => {
    return checkFFmpeg()
  })

  // FFmpeg auto-installer
  ipcMain.handle('ffmpeg:install', async () => {
    try {
      const installDir = await installFFmpeg((stage, percent) => {
        mainWindow.webContents.send('ffmpeg:install-progress', stage, percent)
      })
      // Clear cached paths so next check finds the newly installed binary
      clearFFmpegCache()
      return { success: true, path: installDir }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Installation failed'
      }
    }
  })

  // Helper to create progress callback that sends to renderer
  function makeProgress(event: Electron.IpcMainInvokeEvent) {
    return (status: string, progress: number) => {
      mainWindow.webContents.send('ffmpeg:progress', status, progress)
    }
  }

  // Helper to ensure output directory exists
  function ensureDir(outputPath: string) {
    mkdirSync(dirname(outputPath), { recursive: true })
  }

  // FFmpeg operations
  ipcMain.handle('ffmpeg:picture-to-video', async (event, args) => {
    ensureDir(args.outputPath)
    return pictureToVideo(args.imagePath, args.outputPath, args.durationSeconds, makeProgress(event))
  })

  ipcMain.handle('ffmpeg:picture-audio-to-video', async (event, args) => {
    ensureDir(args.outputPath)
    return pictureAudioToVideo(args.imagePath, args.audioPath, args.outputPath, makeProgress(event))
  })

  ipcMain.handle('ffmpeg:loop-video', async (event, args) => {
    ensureDir(args.outputPath)
    return loopVideo(args.videoPath, args.outputPath, args.durationSeconds, makeProgress(event))
  })

  ipcMain.handle('ffmpeg:video-audio-merge', async (event, args) => {
    ensureDir(args.outputPath)
    return videoAudioMerge(args.videoPath, args.audioPath, args.outputPath, makeProgress(event))
  })

  ipcMain.handle('ffmpeg:youtube-shorts-center', async (event, args) => {
    ensureDir(args.outputPath)
    return youtubeShortsCenter(
      args.videoPath, args.outputPath, args.startTime, args.endTime, makeProgress(event)
    )
  })

  ipcMain.handle('ffmpeg:youtube-shorts-pan', async (event, args) => {
    ensureDir(args.outputPath)
    return youtubeShortsPan(
      args.videoPath, args.outputPath, args.startTime, args.endTime, args.direction, makeProgress(event)
    )
  })

  ipcMain.handle('ffmpeg:multi-audio-compile', async (event, args) => {
    ensureDir(args.outputPath)
    return multiAudioCompile(
      args.audioFiles, args.visualPath, args.outputPath,
      args.crossfadeDuration, args.visualIsVideo, makeProgress(event)
    )
  })

  // Settings
  ipcMain.handle('settings:get', (_event, key: string) => {
    return store.get(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    store.set(key, value)
  })

  // Shell
  ipcMain.handle('shell:open-path', (_event, path: string) => {
    return shell.openPath(path)
  })

  // Auto-updater
  ipcMain.handle('updater:check', async () => {
    await checkForUpdates()
  })

  ipcMain.handle('updater:download', async () => {
    await downloadUpdate()
  })

  ipcMain.handle('updater:install', () => {
    installUpdate()
  })

  ipcMain.handle('updater:get-version', () => {
    return getAppVersion()
  })
}
