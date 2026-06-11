import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, shell } from 'electron'
import EventEmitter from 'events'
import path from 'path'

const iconPath = path.join(
  app.isPackaged ? process.resourcesPath : __dirname,
  '../../assets/icon.png',
)

export class ElectronWindow extends EventEmitter {
  private mainWindow: BrowserWindow
  constructor() {
    super()
    const preload = path.join(__dirname, '../preload/index.js')
    const mainWindow = new BrowserWindow({
      width: 1500,
      height: 900,
      minHeight: 600,
      minWidth: 850,
      show: false,
      autoHideMenuBar: true,
      titleBarStyle: 'hidden',
      icon: iconPath,

      // frame: false,
      // transparent: true,
      // vibrancy: 'under-window',
      // visualEffectState: 'active',

      webPreferences: {
        devTools: is.dev,
        contextIsolation: true,
        nodeIntegration: true,
        nodeIntegrationInSubFrames: false,

        preload: preload,
        sandbox: false,
      },
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })
    mainWindow.webContents.on('will-navigate', (event, url) => {
      event.preventDefault()
      this.emit('navigation-attempt', event, url)
    })
    this.mainWindow = mainWindow
  }

  get window() {
    return this.mainWindow
  }

  getBrowserWindow() {
    return this.mainWindow
  }

  loadUrl(url: string) {
    this.mainWindow.loadURL(url)
  }

  ready() {
    this.emit('ready')
  }

  showWindow() {
    this.mainWindow.show()
    // mainWindow.maximize()
    // @ts-expect-error Available
    this.mainWindow.openDevTools()
  }
}
