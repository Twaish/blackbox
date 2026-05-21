import { Modules } from '@/helpers/ipc/types'
import { ORPCError, os } from '@orpc/server'

function withErrorHandling<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult> | TResult,
) {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await fn(...args)
    } catch (err) {
      console.error(err)

      if (err instanceof ORPCError) {
        throw err
      }

      if (err instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: err.message,
          cause: err,
        })
      }

      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Unknown error',
      })
    }
  }
}

export function createVaultRouters(modules: Modules) {
  return {
    get: os.handler(withErrorHandling(() => modules.VaultManager.getVaults())),
    create: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.createVault(input)),
    ),
    addFile: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.addFile(input)),
    ),
    deleteFile: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.deleteFile(input)),
    ),
    readFile: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.readFile(input)),
    ),
    readMeta: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.readMeta(input)),
    ),
    restoreFile: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.restoreFile(input)),
    ),
    hasSession: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.hasSession(input)),
    ),
    removeSession: os.handler(
      withErrorHandling(({ input }) =>
        modules.VaultManager.removeSession(input),
      ),
    ),
    getFiles: os.handler(
      withErrorHandling(({ input }) =>
        modules.VaultManager.getVaultFiles(input),
      ),
    ),
    unlink: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.unlinkVault(input)),
    ),
    unlock: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.unlockVault(input)),
    ),
    addExisting: os.handler(
      withErrorHandling(({ input }) =>
        modules.VaultManager.addExistingVault(input),
      ),
    ),

    startUpload: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.startUpload(input)),
    ),

    uploadChunk: os.handler(
      withErrorHandling(({ input }) => modules.VaultManager.uploadChunk(input)),
    ),
    finishUpload: os.handler(
      withErrorHandling(({ input }) =>
        modules.VaultManager.finishUpload(input),
      ),
    ),
  }
}
