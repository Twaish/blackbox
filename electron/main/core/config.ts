import { is } from '@electron-toolkit/utils'
import path from 'path'

const devUrl = process.env.ELECTRON_RENDERER_URL

export default {
  APP_URL:
    is.dev && devUrl ? devUrl : path.join(__dirname, `../renderer/index.html`),

  SETTINGS_DIR: './settings',
}
