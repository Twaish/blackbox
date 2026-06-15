interface Modules {
  ElectronWindow: IElectronWindow
  window: BrowserWindowType
  appInfo: AppInfo

  SettingsBuilder: ISettingsBuilder
  SettingsRegistry: ISettingsRegistry

  TaskService: ITaskService

  UpdateService: IUpdateService

  VaultRegistry: IVaultRegistry
  VaultSessions: IVaultSessions
  VaultUploads: IVaultUploads
  VaultManager: IVaultManager
}
