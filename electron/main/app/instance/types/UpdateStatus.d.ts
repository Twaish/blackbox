import type { UpdateInfo } from 'electron-updater'

type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; info: UpdateInfo }
  | { state: 'not-available' }
  | { state: 'downloading' }
  | { state: 'downloaded'; info: UpdateInfo }
  | { state: 'error'; message: string }
