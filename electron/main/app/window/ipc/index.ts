import { Modules } from '@/helpers/ipc/types'
import { os } from '@orpc/server'

export function createWindowRouters({ ElectronWindow, window }: Modules) {
  return {
    minimize: os.handler(() => window.minimize()),
    maximize: os.handler(() => {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }),
    close: os.handler(() => window.close()),
    ready: os.handler(() => ElectronWindow.ready()),
  }
}
