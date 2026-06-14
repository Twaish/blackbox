import { BrowserWindow } from 'electron'

import { AppInfo } from '@/core/types'
import { ElectronWindow } from '@/core/ElectronWindow'

import { UpdateService } from '@/app/instance/UpdateService'

declare interface Modules {
  ElectronWindow: ElectronWindow
  window: BrowserWindow
  appInfo: AppInfo

  SettingsBuilder: ISettingsBuilder
  SettingsRegistry: ISettingsRegistry

  TaskService: ITaskService

  VaultRegistry: IVaultRegistry
  VaultSessions: IVaultSessions
  VaultUploads: IVaultUploads
  VaultManager: IVaultManager

  UpdateService: UpdateService
}
