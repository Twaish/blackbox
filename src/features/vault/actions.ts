import { ipc } from '@/core/ipc'
import { queryClient } from '@/core/queryClient'
import { queryKeys } from './queries'

export async function addVaultFile(
  vaultId: string,
  filepath: string,
): Promise<string> {
  return await ipc.client.vaults.addFile({
    vaultId,
    filepath,
  })
}

export async function deleteVaultFile(vaultId: string, fileId: string) {
  return await ipc.client.vaults.deleteFile({ vaultId, fileId })
}

export async function streamVaultFile({
  vaultId,
  fileId,
  onDone,
  onError,
  onChunk,
  signal,
}: {
  vaultId: string
  fileId: string
  onDone?: (blob: Blob) => void
  onError?: (err: unknown) => void
  onChunk?: (chunk: Uint8Array) => void
  signal?: AbortSignal
}): Promise<void> {
  if (signal?.aborted) return

  const chunks: Uint8Array[] = []

  const stream = window.streams.streamVaultFile(vaultId, fileId, {
    onChunk: (chunk) => {
      if (signal?.aborted) return
      onChunk?.(chunk)
      if (onDone) chunks.push(chunk)
    },
    onEnd: (err) => {
      if (signal?.aborted) return

      if (err) {
        const e = new Error(err)
        onError?.(e)
        throw e
      }

      if (onDone) {
        onDone(new Blob(chunks as BlobPart[]))
      }
    },
  })

  signal?.addEventListener('abort', stream.cancel, { once: true })

  try {
    await stream.promise
  } catch (err) {
    if (!signal?.aborted) {
      onError?.(err)
      throw err
    }
  }
}

export async function readVaultFileMeta(
  vaultId: string,
  fileId: string,
): Promise<VaultFileMeta> {
  return await ipc.client.vaults.readMeta({
    vaultId,
    fileId,
  })
}

export async function restoreVaultFile(
  vaultId: string,
  fileId: string,
  outputFilepath: string,
) {
  return await ipc.client.vaults.restoreFile({
    vaultId,
    fileId,
    outputFilepath,
  })
}

export async function getVaultFiles(vaultId: string): Promise<string[]> {
  return await ipc.client.vaults.getFiles(vaultId)
}

export async function hasSession(vaultId: string): Promise<boolean> {
  return await ipc.client.vaults.hasSession(vaultId)
}

export async function removeSession(vaultId: string) {
  return await ipc.client.vaults.removeSession(vaultId)
}

export async function unlockVault(vaultId: string, passphrase: string) {
  return await ipc.client.vaults.unlock({
    vaultId,
    passphrase,
  })
}

export async function unlinkVault(vaultId: string) {
  return await ipc.client.vaults.unlink(vaultId)
}

export async function createVault(
  location: string,
  name: string,
  passphrase: string,
) {
  return await ipc.client.vaults.create({
    location,
    name,
    passphrase,
  })
}

export async function addExistingVault(vaultPath: string) {
  return await ipc.client.vaults.addExisting(vaultPath)
}

export async function getVaults(): Promise<VaultEntry[]> {
  return await ipc.client.vaults.get()
}

const CHUNK_SIZE = 1024 * 1024 // 1MB

interface UploadState {
  controller: AbortController
  progress: number
  name: string
  mime: string
  size: number
}

const activeUploads = new Map<string, UploadState>()

export async function uploadVaultFile(
  vaultId: string,
  file: File,
): Promise<string | undefined> {
  const abortController = new AbortController()

  const streamId = await window.uploads.start({
    vaultId,
    name: file.name,
    mime: file.type,
  })
  activeUploads.set(streamId, {
    controller: abortController,
    progress: 0,
    name: file.name,
    mime: file.type,
    size: file.size,
  })
  invalidateActiveUploads()

  try {
    let offset = 0

    while (offset < file.size) {
      if (abortController.signal.aborted) {
        throw new Error('Upload cancelled')
      }

      const chunk = file.slice(offset, offset + CHUNK_SIZE)
      const arrayBuffer = await chunk.arrayBuffer()
      await window.uploads.chunk(streamId, arrayBuffer)
      await new Promise<void>((resolve) => setTimeout(resolve, 100))

      offset += CHUNK_SIZE

      const state = activeUploads.get(streamId)!
      state.progress = Math.min(offset / file.size, 1)
      invalidateActiveUploads()
    }

    return await window.uploads.finish(streamId)
  } catch (err) {
    window.streams.abortStream(streamId)
    throw err
  } finally {
    activeUploads.delete(streamId)
    invalidateActiveUploads()
  }
}

export type UploadInfo = {
  streamId: string
  name: string
  mime: string
  size: number
  progress: number
}

export function getActiveUploads(): UploadInfo[] {
  return Array.from(activeUploads.entries()).map(([streamId, state]) => ({
    streamId,
    name: state.name,
    mime: state.mime,
    size: state.size,
    progress: state.progress,
  }))
}

export function abortUpload(streamId: string): void {
  activeUploads.get(streamId)?.controller.abort()
}

export function abortAllUploads(): void {
  for (const { controller } of activeUploads.values()) {
    controller.abort()
  }
}

export function invalidateActiveUploads() {
  queryClient.invalidateQueries({ queryKey: queryKeys.activeUploads() })
}

export async function getShouldPreview(): Promise<boolean> {
  const value = localStorage.getItem('should-preview')
  return value === 'true'
}
export async function setShouldPreview(enabled: boolean): Promise<boolean> {
  localStorage.setItem('should-preview', String(enabled))
  return enabled
}
export async function toggleShouldPreview(): Promise<boolean> {
  const current = await getShouldPreview()
  const next = !current
  localStorage.setItem('should-preview', String(next))
  return next
}

export const VIEW_STYLES = ['grid', 'list'] as const
export type ViewStyle = (typeof VIEW_STYLES)[number]
function isViewStyle(value: unknown): value is ViewStyle {
  return typeof value === 'string' && VIEW_STYLES.includes(value as ViewStyle)
}
export async function getViewStyle(): Promise<ViewStyle> {
  const value = localStorage.getItem('view-style')
  if (isViewStyle(value)) return value
  return 'grid'
}
export async function setViewStyle(viewStyle: ViewStyle) {
  localStorage.setItem('view-style', viewStyle)
  return viewStyle
}
