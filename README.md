# DanthosLabs Video Suite

A professional video processing desktop app built with Electron, React, and TypeScript. Powered by FFmpeg under the hood.

## Features

- **Picture to Video** — Turn any image into a video of a chosen duration
- **Picture + Audio to Video** — Combine a static image with an audio track (duration matches audio automatically)
- **Loop Video** — Loop a short clip to a target duration using stream copy (very fast)
- **Video + Audio Merge** — Browse folders of video/audio files, select a pair, and merge them (video loops to match audio)
- **YouTube Shorts Creator** — Convert 16:9 video to vertical 9:16 with center crop or smooth pan modes
- **Multi-Audio Compiler** — Combine multiple audio tracks with crossfade transitions, pair with a visual background
- **10 Built-in Themes** — Dark Pro, Light Clean, Midnight, Warm Gold, Neon Cyber, Soft Rose, Ocean Breeze, Sandstone, Forest, Autumn Ember
- **Custom Theme Editor** — Full control over every color in the UI
- **In-App Auto-Updater** — Check for updates, download, and install from within the app
- **Built-in Guide** — Interactive guide explaining every tool

## Downloads — v2.2.0

Click to download the installer for your platform:

| Platform | Download |
|----------|----------|
| Windows | [DanthosLabs-Setup-2.2.0-x64.exe](https://github.com/danthosstudio/Video_Creation_GUI--publicRepo/releases/download/v2.2.0/DanthosLabs-Setup-2.2.0-x64.exe) |
| macOS (Intel) | [DanthosLabs-2.2.0-x64.dmg](https://github.com/danthosstudio/Video_Creation_GUI--publicRepo/releases/download/v2.2.0/DanthosLabs-2.2.0-x64.dmg) |
| macOS (Apple Silicon) | [DanthosLabs-2.2.0-arm64.dmg](https://github.com/danthosstudio/Video_Creation_GUI--publicRepo/releases/download/v2.2.0/DanthosLabs-2.2.0-arm64.dmg) |
| Linux | [DanthosLabs-2.2.0-x86_64.AppImage](https://github.com/danthosstudio/Video_Creation_GUI--publicRepo/releases/download/v2.2.0/DanthosLabs-2.2.0-x86_64.AppImage) |

Already installed? Just open the app and go to **Settings > Check for Updates** to update in-app.

[All releases & previous versions](https://github.com/danthosstudio/Video_Creation_GUI--publicRepo/releases)

> **Note:** The app is not code-signed, so you may see a SmartScreen warning on Windows or a Gatekeeper prompt on macOS. This is normal for unsigned apps — click "More info" > "Run anyway" on Windows.

## FFmpeg

DanthosLabs automatically downloads and sets up FFmpeg on first launch. No manual installation required.

## Tech Stack

- **Electron** — Cross-platform desktop framework
- **React 18** — UI library
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling
- **Framer Motion** — Animations and transitions
- **electron-vite** — Build tooling
- **electron-builder** — Packaging and distribution
- **electron-updater** — Auto-update via GitHub Releases
- **electron-store** — Persistent settings storage
- **FFmpeg** — Video/audio processing engine

## Development Setup

```bash
# Clone the repo
git clone https://github.com/danthosstudio/Video_Creation_GUI--publicRepo.git
cd Video_Creation_GUI--publicRepo

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
npm run build:all    # All platforms
```

## Project Structure

```
src/
  main/               # Electron main process
    index.ts           # Window creation, app lifecycle
    ipc-handlers.ts    # IPC bridge between main and renderer
    video-processor.ts # FFmpeg command builder and executor
    ffmpeg-installer.ts# Auto-downloads FFmpeg on first run
    updater.ts         # Auto-update logic (electron-updater)
  preload/
    index.ts           # Secure API bridge (contextBridge)
  renderer/
    src/
      components/
        layout/        # AppShell, Sidebar, TitleBar
        tabs/          # Each video tool tab + Guide
        settings/      # ThemePicker, UpdateSection, CustomThemeEditor
        ui/            # Reusable components (Card, AnimatedButton, etc.)
      contexts/        # ThemeContext
      hooks/           # useFFmpeg, useTheme
      lib/             # themes, utils, changelog
```

## Building a Release

1. Bump the version in `package.json`
2. Update `src/renderer/src/lib/changelog.ts` with the new version's notes
3. Build: `npm run build:win` (or mac/linux)
4. Commit and push
5. Create a GitHub Release tagged `vX.X.X` and upload the installer + `latest.yml` + `.blockmap` from `dist/`
6. Users will see the update when they click "Check for Updates" in Settings

Alternatively, push to trigger the GitHub Actions CI workflow which builds for all platforms automatically.

## License

MIT
