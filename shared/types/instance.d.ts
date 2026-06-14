type __Info = import('electron-updater').UpdateInfo

type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; info: __Info }
  | { state: 'not-available' }
  | { state: 'downloading' }
  | { state: 'downloaded'; info: __Info }
  | { state: 'error'; message: string }
