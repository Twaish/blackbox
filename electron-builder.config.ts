import type { Configuration } from 'electron-builder'
import app from './package.json'

const config: Configuration = {
  appId: app.appId,
  productName: app.productName,
  directories: {
    output: 'release',
    buildResources: 'assets',
  },
  files: ['out/**/*', 'drizzle/**/*', 'package.json'],
  asar: true,
  asarUnpack: ['**/*.node'],
  win: { target: 'nsis', icon: 'assets/icon.ico' },
  mac: { target: 'dmg', icon: 'assets/icon.icns' },
  linux: { target: ['AppImage', 'deb'], icon: 'assets/icon.png' },
  publish: null,
}

export default config
