export interface ChangelogEntry {
  version: string
  date: string
  highlights: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '2.2.0',
    date: '2026-03-01',
    highlights: [
      'Added 5 new themes: Soft Rose, Ocean Breeze, Sandstone, Forest, Autumn Ember',
      'Added changelog dropdown — see what changed in each version',
      'More light and earth-toned color options'
    ]
  },
  {
    version: '2.1.0',
    date: '2026-02-28',
    highlights: [
      'Rebranded DanthosStudio → DanthosLabs throughout the app',
      'Added in-app auto-updater (check, download, install from Settings)',
      'Added Guide tab as the default landing page',
      'Fixed 25+ bugs from code audit (concurrency, error handling, cross-platform paths)',
      'Added GitHub Actions CI for automated cross-platform builds'
    ]
  },
  {
    version: '2.0.0',
    date: '2026-02-27',
    highlights: [
      'Complete rebuild from Python/CustomTkinter to Electron + React + TypeScript',
      'New modern UI with sidebar navigation and animated transitions',
      'All 6 video tools: Picture to Video, Picture + Audio, Loop Video, Video + Audio Merge, YouTube Shorts, Multi-Audio Compiler',
      'Theme system with 5 built-in themes and custom theme editor',
      'Automatic FFmpeg download and setup'
    ]
  }
]

export function getChangelogForVersion(version: string): ChangelogEntry | undefined {
  return changelog.find((entry) => entry.version === version)
}
