import type { Configuration } from 'electron-builder'
import app from './package.json'

const artifactNameTemplate = (platform: string) =>
  `\${productName}-${platform}-Setup-\${version}-\${arch}.\${ext}`

const config: Configuration = {
  appId: app.appId,
  productName: app.productName,
  directories: {
    output: 'release',
    buildResources: 'assets',
  },
  files: ['out/**/*', 'package.json'],
  asar: true,
  asarUnpack: ['**/*.node'],
  win: {
    target: 'nsis',
    icon: 'assets/icon.ico',
    artifactName: artifactNameTemplate('Windows'),
  },
  mac: {
    target: 'dmg',
    icon: 'assets/icon.icns',
    artifactName: artifactNameTemplate('Mac'),
  },
  linux: {
    target: ['AppImage', 'deb'],
    icon: 'assets/icon.png',
    artifactName: artifactNameTemplate('Linux'),
  },
  publish: [
    {
      provider: 'github',
      owner: app.author,
      repo: app.name,
    },
  ],
}

export default config
