import { BrowserWindow } from 'electron'

import { AppInfo } from '@/core/types'
import { ElectronWindow } from '@/core/ElectronWindow'

import { ISettingsBuilder } from '@/app/settings/application/ports/ISettingsBuilder'
import { ISettingsRegistry } from '@/app/settings/application/ports/ISettingsRegistry'
import { ITaskService } from '@/app/tasks/application/interfaces/ITaskService'
import { UpdateService } from '@/app/instance/UpdateService'

declare interface Modules {
  ElectronWindow: ElectronWindow
  window: BrowserWindow
  appInfo: AppInfo
  SettingsBuilder: ISettingsBuilder
  SettingsRegistry: ISettingsRegistry
  VaultManager: IVaultManager
  VaultRegistry: IVaultRegistry
  VaultSessions: IVaultSessions
  TaskService: ITaskService
  VaultUploads: IVaultUploads
  UpdateService: UpdateService
}
