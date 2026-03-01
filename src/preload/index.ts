import { contextBridge, ipcRenderer } from 'electron'

export type ProgressCallback = (status: string, progress: number) => void

const api = {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: boolean) => callback(value)
    ipcRenderer.on('window:maximize-change', handler)
    return () => ipcRenderer.removeListener('window:maximize-change', handler)
  },

  // Dialogs
  openFile: (filters: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke('dialog:open-file', filters),
  openFiles: (filters: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke('dialog:open-files', filters),
  openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
  listFiles: (dirPath: string, extensions: string[]) =>
    ipcRenderer.invoke('dialog:list-files', dirPath, extensions),

  // FFmpeg health check
  checkFFmpeg: () =>
    ipcRenderer.invoke('ffmpeg:check') as Promise<{
      available: boolean
      version?: string
      error?: string
      path?: string
    }>,

  // FFmpeg auto-installer
  installFFmpeg: () =>
    ipcRenderer.invoke('ffmpeg:install') as Promise<{
      success: boolean
      path?: string
      error?: string
    }>,

  // Listen for install progress
  onInstallProgress: (callback: (stage: string, percent: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, stage: string, percent: number) => {
      callback(stage, percent)
    }
    ipcRenderer.on('ffmpeg:install-progress', handler)
    return () => ipcRenderer.removeListener('ffmpeg:install-progress', handler)
  },

  // FFmpeg operations
  pictureToVideo: (args: {
    imagePath: string
    outputPath: string
    durationSeconds: number
  }) => ipcRenderer.invoke('ffmpeg:picture-to-video', args),

  pictureAudioToVideo: (args: {
    imagePath: string
    audioPath: string
    outputPath: string
  }) => ipcRenderer.invoke('ffmpeg:picture-audio-to-video', args),

  loopVideo: (args: {
    videoPath: string
    outputPath: string
    durationSeconds: number
  }) => ipcRenderer.invoke('ffmpeg:loop-video', args),

  videoAudioMerge: (args: {
    videoPath: string
    audioPath: string
    outputPath: string
  }) => ipcRenderer.invoke('ffmpeg:video-audio-merge', args),

  youtubeShortsCenter: (args: {
    videoPath: string
    outputPath: string
    startTime: string
    endTime: string
  }) => ipcRenderer.invoke('ffmpeg:youtube-shorts-center', args),

  youtubeShortsPan: (args: {
    videoPath: string
    outputPath: string
    startTime: string
    endTime: string
    direction: 'left_to_right' | 'right_to_left'
  }) => ipcRenderer.invoke('ffmpeg:youtube-shorts-pan', args),

  multiAudioCompile: (args: {
    audioFiles: string[]
    visualPath: string
    outputPath: string
    crossfadeDuration: number
    visualIsVideo: boolean
  }) => ipcRenderer.invoke('ffmpeg:multi-audio-compile', args),

  // Progress listener
  onProgress: (callback: (status: string, progress: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: string, progress: number) => {
      callback(status, progress)
    }
    ipcRenderer.on('ffmpeg:progress', handler)
    return () => ipcRenderer.removeListener('ffmpeg:progress', handler)
  },

  // Settings
  getSettings: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSettings: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),

  // Shell
  openPath: (path: string) => ipcRenderer.invoke('shell:open-path', path),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  getAppVersion: () => ipcRenderer.invoke('updater:get-version') as Promise<string>,
  onUpdateStatus: (callback: (status: {
    event: string
    version?: string
    releaseNotes?: string
    percent?: number
    transferred?: number
    total?: number
    message?: string
  }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: Parameters<typeof callback>[0]) => {
      callback(status)
    }
    ipcRenderer.on('updater:status', handler)
    return () => ipcRenderer.removeListener('updater:status', handler)
  },

  // Platform
  platform: process.platform
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('api', api)
