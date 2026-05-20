import { BrowserWindow } from 'electron'

import { AppInfo } from '@/core/types'
import { ElectronWindow } from '@/core/ElectronWindow'

import { ISettingsBuilder } from '@/app/settings/application/ports/ISettingsBuilder'
import { ISettingsRegistry } from '@/app/settings/application/ports/ISettingsRegistry'

declare interface Modules {
  ElectronWindow: ElectronWindow
  window: BrowserWindow
  appInfo: AppInfo
  SettingsBuilder: ISettingsBuilder
  SettingsRegistry: ISettingsRegistry
  VaultManager: IVaultManager
}
