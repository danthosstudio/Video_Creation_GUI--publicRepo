# DanthosLabs — Architecture & Coding Guide

This document is the complete reference for understanding, navigating, and contributing to the DanthosLabs codebase. Written for both humans and AI agents.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Process Model (Electron)](#process-model)
3. [Directory Structure](#directory-structure)
4. [IPC Communication](#ipc-communication)
5. [Main Process Modules](#main-process-modules)
6. [Preload Bridge](#preload-bridge)
7. [Renderer Architecture](#renderer-architecture)
8. [Component Patterns](#component-patterns)
9. [State Management](#state-management)
10. [Theming System](#theming-system)
11. [FFmpeg Integration](#ffmpeg-integration)
12. [Auto-Updater](#auto-updater)
13. [Naming Conventions](#naming-conventions)
14. [Typing Patterns](#typing-patterns)
15. [Error Handling](#error-handling)
16. [Animation Patterns](#animation-patterns)
17. [Build & Release Pipeline](#build--release-pipeline)
18. [Key Files Quick Reference](#key-files-quick-reference)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Electron App                       │
│                                                     │
│  ┌──────────────┐   IPC Bridge   ┌───────────────┐ │
│  │ Main Process │◄──────────────►│   Renderer    │ │
│  │  (Node.js)   │  (preload.ts)  │   (React)     │ │
│  │              │                │               │ │
│  │ • FFmpeg ops │                │ • UI / Tabs   │ │
│  │ • File I/O   │                │ • Themes      │ │
│  │ • Updater    │                │ • State       │ │
│  │ • Dialogs    │                │ • Animations  │ │
│  └──────────────┘                └───────────────┘ │
│                                                     │
│  FFmpeg (auto-downloaded binary, not bundled)        │
└─────────────────────────────────────────────────────┘
```

**Stack:** Electron 33 + React 18 + TypeScript + Tailwind CSS + Framer Motion + electron-vite

---

## Process Model

Electron runs two isolated processes:

| Process | Runtime | Role | Entry Point |
|---------|---------|------|-------------|
| **Main** | Node.js | Window management, FFmpeg execution, file I/O, auto-update | `src/main/index.ts` |
| **Renderer** | Chromium | React UI, user interaction, theme rendering | `src/renderer/src/main.tsx` |

They cannot directly access each other. All communication goes through IPC via the preload bridge.

**Security settings** (set in `src/main/index.ts`):
- `contextIsolation: true` — renderer can't access Node.js
- `nodeIntegration: false` — no `require()` in renderer
- `sandbox: false` — needed for preload script to work with electron-store

---

## Directory Structure

```
src/
├── main/                          # ── MAIN PROCESS ──
│   ├── index.ts                   # App lifecycle, window creation
│   ├── ipc-handlers.ts            # All IPC handler registrations
│   ├── video-processor.ts         # FFmpeg command builder + executor
│   ├── ffmpeg-installer.ts        # Downloads FFmpeg on first launch
│   └── updater.ts                 # electron-updater auto-update logic
│
├── preload/
│   └── index.ts                   # contextBridge API (the IPC bridge)
│
└── renderer/
    ├── index.html                 # Shell HTML (CSP headers here)
    └── src/
        ├── main.tsx               # React entry point
        ├── App.tsx                # Root component (wraps ThemeProvider)
        ├── globals.css            # Tailwind directives + base styles
        │
        ├── components/
        │   ├── layout/
        │   │   ├── AppShell.tsx   # Main layout (sidebar + content area)
        │   │   ├── Sidebar.tsx    # Navigation sidebar
        │   │   └── TitleBar.tsx   # Custom frameless title bar
        │   │
        │   ├── tabs/              # One component per tool
        │   │   ├── Guide.tsx           # Welcome / help page (default tab)
        │   │   ├── PictureToVideo.tsx
        │   │   ├── PictureAudio.tsx
        │   │   ├── LoopVideo.tsx
        │   │   ├── VideoAudioMerge.tsx
        │   │   ├── YouTubeShorts.tsx
        │   │   └── MultiAudio.tsx
        │   │
        │   ├── settings/
        │   │   ├── ThemePicker.tsx      # Settings page (themes + about)
        │   │   ├── UpdateSection.tsx    # Auto-update UI + changelog
        │   │   └── CustomThemeEditor.tsx # Color picker for custom themes
        │   │
        │   └── ui/                # Reusable primitives
        │       ├── Card.tsx            # Card, CardHeader, CardContent, etc.
        │       ├── AnimatedButton.tsx  # Button with spring animations
        │       ├── FileSelector.tsx    # File picker input
        │       ├── OutputSelector.tsx  # Output directory picker
        │       ├── DurationPicker.tsx  # Time/duration input
        │       ├── ProgressBar.tsx     # Processing progress display
        │       └── FolderBrowser.tsx   # Folder listing with file selection
        │
        ├── contexts/
        │   └── ThemeContext.tsx    # Theme state provider
        │
        ├── hooks/
        │   ├── useFFmpeg.ts       # FFmpeg execution hook (state + progress)
        │   └── useTheme.ts       # Shortcut to ThemeContext
        │
        └── lib/
            ├── themes.ts          # Built-in theme definitions
            ├── changelog.ts       # Version history entries
            └── utils.ts           # Helpers: cn(), joinPath(), filters, etc.
```

**Config files at root:**
- `electron-builder.yml` — packaging config (platforms, publish target)
- `electron.vite.config.ts` — build config (main, preload, renderer)
- `tailwind.config.js` — Tailwind theme extensions
- `tsconfig.json` + `tsconfig.web.json` + `tsconfig.node.json` — TypeScript
- `postcss.config.js` — PostCSS plugins (tailwind + autoprefixer)

---

## IPC Communication

All renderer↔main communication uses Electron IPC through the preload bridge. There are two patterns:

### Fire-and-forget (renderer → main, no response)

```
Renderer:  window.api.minimize()
Preload:   ipcRenderer.send('window:minimize')
Main:      ipcMain.on('window:minimize', () => mainWindow.minimize())
```

Used for: window controls (minimize, maximize, close)

### Request-response (renderer → main → renderer)

```
Renderer:  const result = await window.api.pictureToVideo(image, duration, output)
Preload:   return ipcRenderer.invoke('ffmpeg:picture-to-video', image, duration, output)
Main:      ipcMain.handle('ffmpeg:picture-to-video', async (_e, img, dur, out) => { ... })
```

Used for: all FFmpeg operations, dialogs, settings, updater

### Event push (main → renderer)

```
Main:      mainWindow.webContents.send('ffmpeg:progress', status, progress)
Preload:   ipcRenderer.on('ffmpeg:progress', handler) — returns cleanup fn
Renderer:  window.api.onProgress((status, progress) => { ... })
```

Used for: FFmpeg progress, updater status, maximize state changes

### Channel naming convention

```
namespace:action
```

Examples: `window:minimize`, `ffmpeg:picture-to-video`, `dialog:open-file`, `settings:get`, `updater:check`

---

## Main Process Modules

### `index.ts` — App lifecycle

- Creates a frameless BrowserWindow (1200x800, min 900x650)
- Registers IPC handlers via `registerIpcHandlers()`
- Initializes auto-updater via `initUpdater()`
- Handles external links (opens in default browser)
- Background color: `#0f0f0f` (prevents white flash on load)

### `ipc-handlers.ts` — IPC registrations

Single export: `registerIpcHandlers(mainWindow: BrowserWindow)`

Groups:
- **Window controls** — `window:minimize`, `window:maximize`, `window:close`, `window:is-maximized`
- **Dialogs** — `dialog:open-file`, `dialog:open-files`, `dialog:open-directory`, `dialog:list-files`
- **FFmpeg** — `ffmpeg:check`, `ffmpeg:install`, plus 7 processing operations
- **Settings** — `settings:get`, `settings:set` (uses electron-store)
- **Updater** — `updater:check`, `updater:download`, `updater:install`, `updater:get-version`
- **Shell** — `shell:open-path`

Progress callback pattern:
```typescript
function makeProgress(event: IpcMainInvokeEvent) {
  return (status: string, progress: number) => {
    mainWindow.webContents.send('ffmpeg:progress', status, progress)
  }
}
```

### `video-processor.ts` — FFmpeg engine

**FFmpeg resolution priority:**
1. Auto-installed: `app.getPath('userData')/ffmpeg/`
2. Bundled in resources (packaged app)
3. Common install paths (platform-specific)
4. System PATH

**Core function:**
```typescript
function runFFmpeg(args: string[]): Promise<{ success: boolean; output: string }>
```
Prepends `-loglevel error` to all commands. Uses `execFile` (not `exec`) for security.

**Processing constants:**
| Constant | Value | Purpose |
|----------|-------|---------|
| `VIDEO_CRF` | `'18'` | Quality (0-51, lower = better) |
| `AUDIO_BITRATE` | `'320k'` | Stereo audio quality |
| `SEGMENT_SECONDS` | `10` | Chunk size for long videos |
| `FRAMERATE` | `'1'` | FPS for image-to-video |

**Exported functions:** `pictureToVideo`, `pictureAudioToVideo`, `loopVideo`, `videoAudioMerge`, `createYouTubeShort`, `multiAudioCompile`, `getMediaDuration`, `getReadableDuration`, `listFilesInDirectory`, `basename`, `stem`

### `ffmpeg-installer.ts` — First-run FFmpeg download

Downloads platform-specific static FFmpeg builds:
- **Windows:** gyan.dev (zip)
- **macOS:** evermeet.cx (separate ffmpeg + ffprobe zips)
- **Linux:** johnvansickle.com (tar.xz)

Uses `copyFileSync` instead of `renameSync` to avoid cross-filesystem errors (EXDEV). Follows HTTP redirects (max 5). Reports download progress via callback.

### `updater.ts` — Auto-update module

Uses `electron-updater` pointed at GitHub Releases. Key settings:
- `autoDownload: false` — user must click to download
- `autoInstallOnAppQuit: true`
- Dev mode guard: returns friendly error if `!app.isPackaged`

Events forwarded to renderer via `updater:status` channel.

---

## Preload Bridge

`src/preload/index.ts` exposes `window.api` to the renderer via `contextBridge.exposeInMainWorld`.

The full API shape is defined as `ElectronAPI` type and exported for type checking.

**Listener pattern** — all `on*` methods return a cleanup function:
```typescript
onProgress: (callback) => {
  const handler = (_event, status, progress) => callback(status, progress)
  ipcRenderer.on('ffmpeg:progress', handler)
  return () => ipcRenderer.removeListener('ffmpeg:progress', handler)
}
```

This cleanup function is returned from `useEffect` in the renderer for automatic unsubscription.

---

## Renderer Architecture

### Entry flow

```
main.tsx → App.tsx → ThemeProvider → AppShell
                                      ├── TitleBar
                                      ├── Sidebar
                                      └── Active Tab (animated swap)
```

### Tab routing

No router library. Tab state is a simple `useState<TabId>` in AppShell:

```typescript
type TabId = 'guide' | 'picture-to-video' | 'picture-audio' | 'loop-video'
           | 'video-audio' | 'youtube-shorts' | 'multi-audio' | 'settings'

const tabComponents: Record<TabId, () => JSX.Element> = { ... }
```

Tab transitions use `AnimatePresence` with `mode="wait"`.

### Import alias

`@/` maps to `src/renderer/src/` (configured in both `electron.vite.config.ts` and `tsconfig.web.json`):

```typescript
import { Card } from '@/components/ui/Card'
import { useFFmpeg } from '@/hooks/useFFmpeg'
```

---

## Component Patterns

### UI primitives (`components/ui/`)

Reusable, stateless, style-driven. Accept `className` for composition.

**Card** — compound component:
```tsx
<Card hover glow delay={0.1}>
  <CardContent className="pt-5 pb-5">
    ...
  </CardContent>
</Card>
```

**AnimatedButton** — three variants, three sizes:
```tsx
<AnimatedButton
  variant="primary"    // 'primary' | 'secondary' | 'ghost'
  size="sm"            // 'sm' | 'md' | 'lg'
  loading={isProcessing}
  icon={<Download size={14} />}
  onClick={handleProcess}
>
  Create Video
</AnimatedButton>
```

### Tab components (`components/tabs/`)

Every tab follows the same structure:

```tsx
export function SomeTab() {
  // 1. Local state for inputs
  const [inputFile, setInputFile] = useState<string[]>([])
  const [outputDir, setOutputDir] = useState('')
  const ffmpeg = useFFmpeg()

  // 2. Handler validates + executes
  const handleProcess = async () => {
    if (!inputFile.length || !outputDir) return
    const outputPath = joinPath(outputDir, `${stem(inputFile[0])}_output.mp4`)
    const result = await ffmpeg.execute(() =>
      window.api.someOperation(inputFile[0], outputPath)
    )
    if (!result) return  // Guard: concurrent call or hook error
    if (result.success) showSuccess(result.message)
    else showError(result.message)
  }

  // 3. Render: title + input card + progress card
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1>...</h1>
      <Card>  {/* Inputs */}  </Card>
      <Card>  {/* Progress + button */}  </Card>
    </div>
  )
}
```

**Critical pattern:** Always check `if (!result) return` after `ffmpeg.execute()`. The hook returns `undefined` if another operation is already running.

### Settings page (`components/settings/`)

`ThemePicker.tsx` is the settings page container. It renders:
1. `<UpdateSection />` — auto-updater + changelog
2. Theme grid (built-in + custom themes)
3. Custom theme editor (expandable)
4. About section

---

## State Management

| Scope | Tool | Where |
|-------|------|-------|
| **Component-local** | `useState` | Tab inputs, UI toggles |
| **Cross-component** | React Context | Theme (ThemeContext) |
| **Persistent** | electron-store | Theme selection, custom themes |
| **Process bridge** | IPC | FFmpeg results, file dialogs |
| **Processing state** | useFFmpeg hook | Progress, status, isProcessing |

### useFFmpeg hook

Central hook for all FFmpeg operations. Manages:
- `status: string` — current status message
- `progress: number` — 0-100 percent
- `isProcessing: boolean` — lock flag
- `result: { success, message } | null`

**Concurrency guard:** Uses `useRef(false)` to prevent overlapping FFmpeg calls. If `processingRef.current` is true, `execute()` returns `undefined` immediately.

**Generic execute:**
```typescript
const execute = useCallback(
  async <T>(operation: () => Promise<T>): Promise<T | undefined> => { ... },
  []
)
```

### ThemeContext

Provides: `currentTheme`, `allThemes`, `customThemes`, `setTheme()`, `saveCustomTheme()`, `deleteCustomTheme()`

Custom themes get IDs like `custom-1709312400000` (timestamp-based). All theme changes persist via `window.api.setSettings()`.

---

## Theming System

### How it works

Themes are objects of CSS custom property values. When a theme is applied, each property is set on `:root`:

```typescript
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(key, value)  // e.g. '--accent' = '#3b82f6'
  }
}
```

### CSS variable list

| Variable | Purpose | Example |
|----------|---------|---------|
| `--bg-primary` | Main background | `#0f0f0f` |
| `--bg-secondary` | Slightly lighter bg | `#171717` |
| `--bg-card` | Card background | `#1e1e1e` |
| `--bg-card-hover` | Card hover state | `#262626` |
| `--accent` | Primary brand color | `#3b82f6` |
| `--accent-hover` | Accent on hover | `#60a5fa` |
| `--accent-muted` | Low-opacity accent bg | `rgba(59,130,246,0.15)` |
| `--accent-glow` | Shadow/glow accent | `rgba(59,130,246,0.25)` |
| `--text` | Primary text | `#e4e4e7` |
| `--text-muted` | Secondary text | `#a1a1aa` |
| `--text-dim` | Tertiary/disabled text | `#52525b` |
| `--border` | Default borders | `#27272a` |
| `--border-hover` | Border on hover | `#3f3f46` |
| `--success` | Success green | `#22c55e` |
| `--error` | Error red | `#ef4444` |
| `--warning` | Warning amber | `#f59e0b` |
| `--titlebar` | Title bar bg | `#0a0a0a` |
| `--sidebar` | Sidebar bg | `#111111` |
| `--scrollbar` | Scrollbar track | `#333333` |
| `--scrollbar-hover` | Scrollbar on hover | `#555555` |

### Using theme colors in components

Always use CSS variables inline, never hardcoded colors:

```tsx
// Correct
<div style={{ background: 'var(--bg-card)', color: 'var(--text)' }}>

// Wrong
<div style={{ background: '#1e1e1e', color: '#e4e4e7' }}>
```

Tailwind classes are mapped to these variables in `tailwind.config.js` under `extend.colors`.

### Built-in themes (10)

**Dark:** Dark Pro, Midnight, Neon Cyber
**Light:** Light Clean, Soft Rose, Ocean Breeze, Sandstone
**Earth:** Warm Gold, Forest, Autumn Ember

Defined in `src/renderer/src/lib/themes.ts`.

---

## FFmpeg Integration

### Lifecycle

1. **First launch:** `ffmpeg:check` returns false → UI shows FFmpegSetupGate → user clicks install → `ffmpeg:install` downloads binary → stored in `userData/ffmpeg/`
2. **Subsequent launches:** `ffmpeg:check` returns true → app loads normally
3. **Processing:** Each tab calls its corresponding `window.api.*` method → main process runs `execFile(ffmpegPath, args)` → progress sent back via IPC

### Adding a new FFmpeg operation

1. **`video-processor.ts`** — add the processing function:
   ```typescript
   export async function myNewOperation(
     input: string, output: string, onProgress?: ProgressCallback
   ): Promise<Result> {
     onProgress?.('Starting...', 0)
     const result = await runFFmpeg(['-i', input, '-y', output])
     onProgress?.('Done', 100)
     return { success: result.success, message: result.success ? output : 'Failed' }
   }
   ```

2. **`ipc-handlers.ts`** — register the handler:
   ```typescript
   ipcMain.handle('ffmpeg:my-new-op', async (_event, input, output) => {
     return myNewOperation(input, output, makeProgress(_event))
   })
   ```

3. **`preload/index.ts`** — expose to renderer:
   ```typescript
   myNewOperation: (input: string, output: string) =>
     ipcRenderer.invoke('ffmpeg:my-new-op', input, output) as Promise<Result>
   ```

4. **Create tab component** — follow the pattern in any existing tab

5. **`Sidebar.tsx`** — add nav item with TabId

6. **`AppShell.tsx`** — add to `tabComponents` record

---

## Auto-Updater

### Flow

```
User clicks "Check for Updates"
  → renderer: window.api.checkForUpdates()
  → main: autoUpdater.checkForUpdates()
  → GitHub API: GET /repos/{owner}/{repo}/releases/latest
  → Compares version in latest.yml with app version
  → If newer: sends 'available' event to renderer
  → User clicks "Download & Install"
  → Downloads .exe/.dmg/.AppImage from release assets
  → Sends progress events (percent, bytes)
  → When done: sends 'downloaded' event
  → User clicks "Restart to Update"
  → autoUpdater.quitAndInstall()
```

### Release files required

For the updater to work, each GitHub Release must have:
- The installer file (`.exe`, `.dmg`, `.AppImage`)
- `latest.yml` (Windows), `latest-mac.yml` (macOS), `latest-linux.yml` (Linux)
- `.blockmap` file (for differential updates)

These are generated automatically by `electron-builder` and uploaded by CI.

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| React component | PascalCase | `PictureToVideo.tsx` |
| Hook | camelCase with `use` prefix | `useFFmpeg.ts` |
| Utility/lib | camelCase | `utils.ts`, `themes.ts` |
| Context | PascalCase with Context suffix | `ThemeContext.tsx` |
| Main process module | kebab-case | `video-processor.ts`, `ipc-handlers.ts` |
| Config files | kebab-case or standard names | `electron-builder.yml` |

### Code

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `AnimatedButton`, `CardContent` |
| Hooks | camelCase, `use` prefix | `useFFmpeg()`, `useTheme()` |
| Functions | camelCase, verb prefix | `handleProcess`, `getMediaDuration` |
| Event handlers | `handle` prefix | `handleCheck`, `handleDownload` |
| State variables | camelCase, descriptive noun | `imageFile`, `outputDir`, `isProcessing` |
| State setters | `set` prefix | `setImageFile`, `setOutputDir` |
| Boolean state | `is`/`has`/`show` prefix | `isProcessing`, `showEditor` |
| Constants | UPPER_SNAKE_CASE | `VIDEO_CRF`, `AUDIO_BITRATE` |
| Types/Interfaces | PascalCase | `ThemeColors`, `FFmpegState`, `UpdateState` |
| IPC channels | kebab-case, namespaced | `ffmpeg:picture-to-video`, `window:minimize` |
| Theme IDs | kebab-case | `dark-pro`, `soft-rose`, `autumn-ember` |
| CSS variables | kebab-case, `--` prefix | `--bg-primary`, `--accent-muted` |

### Unused parameters

Prefix with underscore: `_event`, `_e`

---

## Typing Patterns

### Discriminated unions for state machines

```typescript
type UpdateState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string }
  | { phase: 'downloading'; percent: number; transferred: number; total: number }
  | { phase: 'downloaded'; version: string }
  | { phase: 'error'; message: string }
```

Switch on `state.phase` and TypeScript narrows the type automatically.

### Result types

```typescript
type Result = { success: boolean; message: string }
```

Used consistently across all FFmpeg operations.

### Generic hooks

```typescript
async <T>(operation: () => Promise<T>): Promise<T | undefined>
```

The `useFFmpeg` execute method is generic over the return type.

### Component props

```typescript
interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}
```

Extend HTML element attributes for native prop forwarding.

---

## Error Handling

### Main process

- FFmpeg operations return `{ success: false, message: '...' }` — never throw
- File operations use try-catch with fallback cleanup
- Dialog cancellations return `null`
- `execFile` errors are caught and wrapped in result objects

### Renderer

- `useFFmpeg.execute()` catches all errors internally, wraps in result
- Returns `undefined` for concurrent calls (not an error)
- Toast notifications for user-facing feedback: `showSuccess()`, `showError()`
- No uncaught promise rejections

### Preload

- `ipcRenderer.invoke()` returns promises that reject if handler throws
- Type casting with `as Promise<T>` for return types

### Philosophy

Errors never crash the app. Everything is caught, wrapped, and surfaced to the user as a toast or status message.

---

## Animation Patterns

All animations use **Framer Motion**. Consistent patterns:

### Page transitions (tab switching)

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    <ActiveTabComponent />
  </motion.div>
</AnimatePresence>
```

### Card entrance (staggered)

```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.06 }}
/>
```

### Button springs

```tsx
<motion.button
  whileHover={{ scale: 1.02, y: -1 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
/>
```

### Sidebar indicator

```tsx
<motion.div
  layoutId="sidebar-indicator"  // Shared layout animation
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
/>
```

### Collapsible sections

```tsx
<AnimatePresence>
  {show && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    />
  )}
</AnimatePresence>
```

### Sidebar width

```tsx
<motion.nav
  animate={{ width: collapsed ? 60 : 220 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
/>
```

### Theme transitions

Applied via `.theme-transition` class (scoped, not global `*`) to prevent conflicts with Framer Motion.

---

## Build & Release Pipeline

### Local development

```bash
npm run dev          # electron-vite dev server with HMR
```

### Production build

```bash
npm run build:win    # electron-vite build + electron-builder --win
npm run build:mac    # electron-vite build + electron-builder --mac
npm run build:linux  # electron-vite build + electron-builder --linux
```

Output goes to `dist/`.

### CI/CD (GitHub Actions)

Workflow: `.github/workflows/build.yml`

**Triggers:**
- Push to `main` → builds all 3 platforms (artifacts in Actions tab)
- Push `v*` tag → builds all 3 platforms + uploads to GitHub Release
- Manual dispatch → builds all 3 platforms

**Release job** uses `softprops/action-gh-release` to upload installer + yml + blockmap files.

### Release checklist

1. Bump `version` in `package.json`
2. Add entry to `src/renderer/src/lib/changelog.ts`
3. Update download links in `README.md`
4. Commit and push to `main`
5. Tag and push: `git tag v2.3.0 && git push origin v2.3.0`
6. CI builds all platforms and uploads to the release automatically
7. Users see the update via in-app updater

### Artifact naming

```
DanthosLabs-Setup-{version}-x64.exe          # Windows
DanthosLabs-{version}-x64.dmg                # macOS Intel
DanthosLabs-{version}-arm64.dmg              # macOS Apple Silicon
DanthosLabs-{version}-x86_64.AppImage        # Linux
```

Configured in `electron-builder.yml` via `artifactName` per platform.

---

## Key Files Quick Reference

| Need to... | Look at |
|------------|---------|
| Add a new video tool | `video-processor.ts` → `ipc-handlers.ts` → `preload/index.ts` → new tab in `tabs/` → `Sidebar.tsx` → `AppShell.tsx` |
| Change a theme or add one | `src/renderer/src/lib/themes.ts` |
| Modify the update UI | `src/renderer/src/components/settings/UpdateSection.tsx` |
| Add a changelog entry | `src/renderer/src/lib/changelog.ts` |
| Change window behavior | `src/main/index.ts` |
| Add persistent settings | `ipc-handlers.ts` (electron-store) → `preload/index.ts` |
| Modify packaging | `electron-builder.yml` |
| Change build config | `electron.vite.config.ts` |
| Add a new UI primitive | `src/renderer/src/components/ui/` |
| Understand the full API | `src/preload/index.ts` (ElectronAPI type) |
| Debug FFmpeg commands | `src/main/video-processor.ts` → `runFFmpeg()` |
