import { BrowserWindow } from 'electron'

import { AppInfo } from '@/core/types'
import { ElectronWindow } from '@/core/ElectronWindow'

import { ISettingsBuilder } from '@/app/settings/application/ports/ISettingsBuilder'
import { ISettingsRegistry } from '@/app/settings/application/ports/ISettingsRegistry'
import { VaultRegistry } from '@/features/vault/adapters/VaultRegistry'
import { VaultSessions } from '@/features/vault/adapters/VaultSessions'
import { ITaskService } from '@/app/tasks/application/interfaces/ITaskService'
import { UploadManager } from '@/features/vault/adapters/UploadManager'

declare interface Modules {
  ElectronWindow: ElectronWindow
  window: BrowserWindow
  appInfo: AppInfo
  SettingsBuilder: ISettingsBuilder
  SettingsRegistry: ISettingsRegistry
  VaultManager: IVaultManager
  VaultRegistry: VaultRegistry
  VaultSessions: VaultSessions
  TaskService: ITaskService
  UploadManager: UploadManager
}
