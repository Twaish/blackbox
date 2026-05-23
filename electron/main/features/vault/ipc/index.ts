import { Modules } from '@/helpers/ipc/types'
import { eventIterator, ORPCError, os } from '@orpc/server'
import {
  abortedEventSchema,
  addFileInputSchema,
  createInputSchema,
  fileIdSchema,
  finishedEventSchema,
  getFilesOutputSchema,
  getOutputSchema,
  pathSchema,
  progressEventSchema,
  renameInputSchema,
  restoreFileSchema,
  startedEventSchema,
  unlockInputSchema,
  vaultFileMetaSchema,
  vaultFileSchema,
  vaultIdSchema,
} from './schemas'
import { createVaultUseCases } from '../usecases'
import { MemoryPublisher } from '@orpc/experimental-publisher/memory'
import { UploadEventMap } from '../adapters/UploadEvents'

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

export const subscriptionHandler = <T>(
  iteratorFactory: (signal?: AbortSignal) => AsyncIterable<T>,
) =>
  withErrorHandling(async function* ({ signal }: { signal?: AbortSignal }) {
    for await (const payload of iteratorFactory(signal)) {
      yield payload
    }
  })

export function createVaultRouters(modules: Modules) {
  const { UploadEvents } = modules
  const uploadPublisher = new MemoryPublisher<{
    startedInfo: UploadEventMap['started']
    progressInfo: UploadEventMap['progress']
    finishedInfo: UploadEventMap['finished']
    abortedInfo: UploadEventMap['aborted']
  }>()

  UploadEvents.on('started', (payload) =>
    uploadPublisher.publish('startedInfo', payload),
  )
  UploadEvents.on('progress', (payload) =>
    uploadPublisher.publish('progressInfo', payload),
  )
  UploadEvents.on('finished', (payload) =>
    uploadPublisher.publish('finishedInfo', payload),
  )
  UploadEvents.on('aborted', (payload) =>
    uploadPublisher.publish('abortedInfo', payload),
  )

  const usecases = createVaultUseCases(modules)
  return {
    onUploadStarted: os
      .output(eventIterator(startedEventSchema))
      .handler(
        subscriptionHandler((signal) =>
          uploadPublisher.subscribe('startedInfo', { signal }),
        ),
      ),
    onUploadProgress: os
      .output(eventIterator(progressEventSchema))
      .handler(
        subscriptionHandler((signal) =>
          uploadPublisher.subscribe('progressInfo', { signal }),
        ),
      ),
    onUploadFinished: os
      .output(eventIterator(finishedEventSchema))
      .handler(
        subscriptionHandler((signal) =>
          uploadPublisher.subscribe('finishedInfo', { signal }),
        ),
      ),
    onUploadAborted: os
      .output(eventIterator(abortedEventSchema))
      .handler(
        subscriptionHandler((signal) =>
          uploadPublisher.subscribe('abortedInfo', { signal }),
        ),
      ),

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
    deleteFile: os
      .input(vaultFileSchema)
      .handler(
        withErrorHandling(({ input }) =>
          usecases.deleteVaultFile.execute(input),
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
    getFiles: os
      .input(vaultIdSchema)
      .output(getFilesOutputSchema)
      .handler(
        withErrorHandling(({ input }) => usecases.getVaultFiles.execute(input)),
      ),
    unlock: os
      .input(unlockInputSchema)
      .handler(
        withErrorHandling(({ input }) => usecases.unlockVault.execute(input)),
      ),
  }
}
