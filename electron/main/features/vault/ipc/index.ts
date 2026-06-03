import { Modules } from '@/helpers/ipc/types'
import { ORPCError, os } from '@orpc/server'
import {
  addFileInputSchema,
  changeLocationInputSchema,
  changePassphraseInputSchema,
  createInputSchema,
  deleteFilesInputSchema,
  fileIdSchema,
  getFilesInputSchema,
  getFilesOutputSchema,
  getOutputSchema,
  pathSchema,
  renameInputSchema,
  restoreAllFilesInputSchema,
  restoreFileSchema,
  restoreFilesInputSchema,
  unlockInputSchema,
  vaultExistsOutputSchema,
  vaultFileMetaSchema,
  vaultFileSchema,
  vaultIdSchema,
} from './schemas'
import { createVaultUseCases } from '../usecases'

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
  const usecases = createVaultUseCases(modules)
  return {
    get: os
      .output(getOutputSchema)
      .handler(withErrorHandling(() => usecases.getVaults.execute())),
    unlink: os
      .input(vaultIdSchema)
      .handler(
        withErrorHandling(({ input }) => usecases.unlinkVault.execute(input)),
      ),
    addExisting: os
      .input(pathSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.addExistingVault.execute(input),
        ),
      ),
    exists: os
      .input(vaultIdSchema)
      .output(vaultExistsOutputSchema)
      .handler(
        withErrorHandling(({ input }) => usecases.vaultExists.execute(input)),
      ),
    changeLocation: os
      .input(changeLocationInputSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.changeVaultLocation.execute(input),
        ),
      ),

    hasSession: os
      .input(vaultIdSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.hasVaultSession.execute(input),
        ),
      ),
    removeSession: os
      .input(vaultIdSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.removeVaultSession.execute(input),
        ),
      ),

    create: os
      .input(createInputSchema)
      .handler(
        withErrorHandling(({ input }) => usecases.createVault.execute(input)),
      ),
    rename: os
      .input(renameInputSchema)
      .handler(
        withErrorHandling(({ input }) => usecases.renameVault.execute(input)),
      ),
    addFile: os
      .input(addFileInputSchema)
      .output(fileIdSchema)
      .handler(
        withErrorHandling(({ input }) => usecases.addVaultFile.execute(input)),
      ),
    deleteFiles: os
      .input(deleteFilesInputSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.deleteVaultFiles.execute(input),
        ),
      ),
    readMeta: os
      .input(vaultFileSchema)
      .output(vaultFileMetaSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.readVaultFileMeta.execute(input),
        ),
      ),
    restoreFile: os
      .input(restoreFileSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.restoreVaultFile.execute(input),
        ),
      ),
    restoreFiles: os
      .input(restoreFilesInputSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.restoreVaultFiles.execute(input),
        ),
      ),
    restoreAllFiles: os
      .input(restoreAllFilesInputSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.restoreAllVaultFiles.execute(input),
        ),
      ),
    getFiles: os
      .input(getFilesInputSchema)
      .output(getFilesOutputSchema)
      .handler(
        withErrorHandling(({ input }) => usecases.getVaultFiles.execute(input)),
      ),
    unlock: os
      .input(unlockInputSchema)
      .handler(
        withErrorHandling(({ input }) => usecases.unlockVault.execute(input)),
      ),
    changePassphrase: os
      .input(changePassphraseInputSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.changePassphrase.execute(input),
        ),
      ),
  }
}
