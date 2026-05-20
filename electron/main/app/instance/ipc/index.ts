import { app, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { os } from '@orpc/server'
import { Modules } from '@/helpers/ipc/types'
import {
  nameOutputSchema,
  openFolderInputSchema,
  saveFileInputSchema,
  selectFileOutputSchema,
  selectFolderOutputSchema,
  versionOutputSchema,
} from './schemas'

export function createInstanceRouters({ appInfo }: Modules) {
  return {
    name: os.output(nameOutputSchema).handler(() => appInfo.name),
    version: os.output(versionOutputSchema).handler(() => appInfo.version),
    openFolder: os.input(openFolderInputSchema).handler(({ input }) => {
      if (fs.existsSync(input)) {
        shell.openPath(input)
      }
    }),
    selectFolder: os.output(selectFolderOutputSchema).handler(async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      })

      if (result.canceled) return null

      return result.filePaths[0]
    }),
    saveFile: os.input(saveFileInputSchema).handler(async ({ input }) => {
      const downloads = app.getPath('downloads')
      const result = await dialog.showSaveDialog({
        title: 'Save file',
        defaultPath: path.join(downloads, input),
        filters: [{ name: 'File', extensions: ['*'] }],
      })

      if (result.canceled || !result.filePath) {
        return null
      }

      return result.filePath
    }),
    selectFile: os.output(selectFileOutputSchema).handler(async () => {
      const downloads = app.getPath('downloads')

      const result = await dialog.showOpenDialog({
        defaultPath: downloads,
        properties: ['openFile'],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      return result.filePaths[0]
    }),
  }
}
