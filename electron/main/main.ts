import 'dotenv/config'
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
import { SessionStore } from './features/vault/adapters/SessionStore'
import { VaultFileStore } from './features/vault/adapters/VaultFileStore'
import { UploadStore } from './features/vault/adapters/UploadStore'
import { EncryptedJsonStore } from './features/vault/adapters/EncryptedJsonStore'
import { VaultCrypto } from './features/vault/adapters/VaultCrypto'
import { VaultPaths } from './features/vault/adapters/VaultPaths'
import { UploadEvents } from './features/vault/adapters/UploadEvents'

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

    const uploadEvents = new UploadEvents()
    const vaultPaths = new VaultPaths()
    const vaultCrypto = new VaultCrypto()
    const sessionStore = new SessionStore()

    const encryptedJsonStore = new EncryptedJsonStore(vaultCrypto)
    const vaultFileStore = new VaultFileStore(
      encryptedJsonStore,
      vaultCrypto,
      vaultPaths,
      uploadEvents,
    )
    const uploadStore = new UploadStore(
      encryptedJsonStore,
      vaultCrypto,
      vaultPaths,
      vaultFileStore,
      uploadEvents,
    )

    const vaultRegistry = new VaultRegistry(settingsBuilder, vaultPaths)
    const vaultManager = new VaultManager(
      vaultRegistry,
      sessionStore,
      vaultFileStore,
      uploadStore,
      vaultCrypto,
      vaultPaths,
    )

    const mainWindow = new ElectronWindow()
    const modules: Modules = {
      ElectronWindow: mainWindow,
      window: mainWindow.window,
      appInfo,

      SettingsBuilder: settingsBuilder,
      SettingsRegistry: settingsRegistry,

      VaultManager: vaultManager,
      VaultRegistry: vaultRegistry,
      SessionStore: sessionStore,

      UploadEvents: uploadEvents,
    }

    app.on('before-quit', async () => {
      await settingsRegistry.flushAll()
    })

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
