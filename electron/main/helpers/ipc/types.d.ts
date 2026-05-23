import { BrowserWindow } from 'electron'

import { AppInfo } from '@/core/types'
import { ElectronWindow } from '@/core/ElectronWindow'

import { ISettingsBuilder } from '@/app/settings/application/ports/ISettingsBuilder'
import { ISettingsRegistry } from '@/app/settings/application/ports/ISettingsRegistry'
import { VaultRegistry } from '@/features/vault/adapters/VaultRegistry'
import { SessionStore } from '@/features/vault/adapters/SessionStore'
import { UploadEvents } from '@/features/vault/adapters/UploadEvents'

declare interface Modules {
  ElectronWindow: ElectronWindow
  window: BrowserWindow
  appInfo: AppInfo
  SettingsBuilder: ISettingsBuilder
  SettingsRegistry: ISettingsRegistry
  VaultManager: IVaultManager
  VaultRegistry: VaultRegistry
  SessionStore: SessionStore
  UploadEvents: UploadEvents
}
