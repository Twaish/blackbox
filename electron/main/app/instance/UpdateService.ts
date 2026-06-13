import { autoUpdater } from 'electron-updater'
import { EventEmitter } from 'events'
import { UpdateStatus } from './types/UpdateStatus'
import { is } from '@electron-toolkit/utils'

export class UpdateService extends EventEmitter {
  private status: UpdateStatus = { state: 'idle' }

  constructor() {
    super()
    autoUpdater.forceDevUpdateConfig = is.dev
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false

    autoUpdater.on('checking-for-update', () => {
      return this.setStatus({ state: 'checking' })
    })
    autoUpdater.on('update-available', (info) => {
      return this.setStatus({ state: 'available', info })
    })
    autoUpdater.on('update-not-available', () => {
      return this.setStatus({ state: 'not-available' })
    })
    autoUpdater.on('update-downloaded', (info) => {
      return this.setStatus({ state: 'downloaded', info })
    })
    autoUpdater.on('error', (err) => {
      return this.setStatus({
        state: 'error',
        message: err?.message ?? 'Unknown error',
      })
    })
    this.checkForUpdates()
  }

  private setStatus(status: UpdateStatus) {
    this.status = status
    this.emit('status', status)
  }

  getStatus(): UpdateStatus {
    return this.status
  }

  async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates()
    } catch (err) {
      this.setStatus({
        state: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  async downloadUpdate() {
    await autoUpdater.downloadUpdate()
  }

  quitAndInstall() {
    autoUpdater.quitAndInstall()
  }
}
