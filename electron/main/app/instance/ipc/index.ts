import { app, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { eventIterator, os } from '@orpc/server'
import {
  nameOutputSchema,
  openFolderInputSchema,
  saveFileInputSchema,
  selectFileOutputSchema,
  selectFolderOutputSchema,
  updateStatusSchema,
  versionOutputSchema,
} from './schemas'
import { MemoryPublisher } from '@orpc/experimental-publisher/memory'
import { subscriptionHandler } from '@/utils/orpc'

export function createInstanceRouters({ appInfo, UpdateService }: Modules) {
  const updateEventPublisher = new MemoryPublisher<{
    status: UpdateStatus
  }>()
  UpdateService.on('status', (status: UpdateStatus) =>
    updateEventPublisher.publish('status', status),
  )
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
    checkForUpdates: os.output(updateStatusSchema).handler(async () => {
      await UpdateService.checkForUpdates()
      return UpdateService.getStatus()
    }),
    downloadUpdate: os.handler(async () => {
      await UpdateService.downloadUpdate()
    }),
    quitAndInstall: os.handler(() => {
      UpdateService.quitAndInstall()
    }),
    getUpdateStatus: os.output(updateStatusSchema).handler(() => {
      return UpdateService.getStatus()
    }),
    onStatus: os
      .output(eventIterator(updateStatusSchema))
      .handler(
        subscriptionHandler((signal) =>
          updateEventPublisher.subscribe('status', { signal }),
        ),
      ),
  }
}
