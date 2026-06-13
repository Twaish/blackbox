import { app, BrowserWindow } from 'electron'

import config from './core/config'
import { AppInfo } from './core/types'
import { JsonStore } from './core/JsonStore'
import { ElectronWindow } from './core/ElectronWindow'

import { Modules } from './helpers/ipc/types'
import { createOrpcRouter } from './helpers/ipc/create-orpc-router'
import { registerOrpcHandler } from './helpers/ipc/register-orpc-handler'
import { registerStreamHandlers } from './helpers/ipc/register-stream-handlers'
import { createCryptoServices } from './helpers/create-crypto-services'

import { SettingsBuilder } from './app/settings/infrastructure/adapters/SettingsBuilder'
import { SettingsRegistry } from './app/settings/infrastructure/adapters/SettingsRegistry'
import { VaultManager } from './features/vault/adapters/VaultManager'
import { VaultRegistry } from './features/vault/adapters/VaultRegistry'
import { VaultSessions } from './features/vault/adapters/VaultSessions'
import { VaultFileStore } from './features/vault/adapters/VaultFileStore'
import { VaultCrypto } from './features/vault/adapters/VaultCrypto'
import { VaultPaths } from './features/vault/adapters/VaultPaths'
import { TaskService } from './app/tasks/application/services/TaskService'
import { UploadManager } from './features/vault/adapters/UploadManager'
import { UpdateService } from './app/instance/UpdateService'

app.commandLine.appendSwitch('trace-warnings')
app.whenReady().then(async () => {
  const userData = app.getPath('userData')
  const { APP_URL, SETTINGS_DIR } = config

  const appInfo: AppInfo = {
    name: app.getName(),
    version: app.getVersion(),
  }

  try {
    const settingsStore = new JsonStore({
      basePath: SETTINGS_DIR,
      root: userData,
    })
    const settingsRegistry = new SettingsRegistry()
    const settingsBuilder = new SettingsBuilder(
      {
        store: settingsStore,
        ...createCryptoServices(),
      },
      settingsRegistry,
    )

    const updateService = new UpdateService()

    const taskService = new TaskService()

    const vaultPaths = new VaultPaths()
    const vaultCrypto = new VaultCrypto()
    const vaultSessions = new VaultSessions()
    const vaultRegistry = new VaultRegistry(settingsBuilder, vaultPaths)
    const vaultFileStore = new VaultFileStore(vaultCrypto, vaultPaths)

    const uploadManager = new UploadManager(
      vaultCrypto,
      vaultPaths,
      taskService,
    )

    const vaultManager = new VaultManager(
      vaultRegistry,
      vaultSessions,
      vaultFileStore,
      vaultCrypto,
      vaultPaths,
      taskService,
      uploadManager,
    )

    const mainWindow = new ElectronWindow()
    const modules: Modules = {
      ElectronWindow: mainWindow,
      window: mainWindow.window,
      appInfo,

      SettingsBuilder: settingsBuilder,
      SettingsRegistry: settingsRegistry,
      TaskService: taskService,

      VaultManager: vaultManager,
      VaultRegistry: vaultRegistry,
      VaultSessions: vaultSessions,
      UploadManager: uploadManager,
      UpdateService: updateService,
    }

    app.on('before-quit', async () => {
      await settingsRegistry.flushAll()
    })

    taskService.on('error', (err) => console.error(err))

    await vaultRegistry.init()

    registerOrpcHandler(createOrpcRouter(modules))
    registerStreamHandlers(modules)

    mainWindow.loadUrl(APP_URL)
    mainWindow.showWindow()
  } catch (err) {
    console.error(err)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const newWindow = new ElectronWindow()
    newWindow.showWindow()
  }
})
