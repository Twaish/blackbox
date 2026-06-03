import { ipc } from '@/core/ipc'

export async function addVaultFile(
  vaultId: string,
  filepath: string,
): Promise<string> {
  return await ipc.client.vaults.addFile({
    vaultId,
    filepath,
  })
}

export async function deleteVaultFiles(vaultId: string, fileIds: string[]) {
  return await ipc.client.vaults.deleteFiles({ vaultId, fileIds })
}

export function abortStream(streamId: string): void {
  window.streams.abortStream(streamId)
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
        const blob = new Blob(chunks as BlobPart[])
        chunks.length = 0
        onDone(blob)
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

export async function uploadVaultFile(
  vaultId: string,
  file: File,
  signal?: AbortSignal,
): Promise<string | undefined> {
  if (signal?.aborted) return

  const stream = window.streams.uploadVaultFile(
    vaultId,
    file.name,
    file.type,
    file.size,
    (offset, size) => file.slice(offset, offset + size).arrayBuffer(),
  )

  signal?.addEventListener('abort', stream.cancel, { once: true })

  try {
    return (await stream.promise) as string
  } catch (err) {
    stream.cancel()
    throw err
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
export async function restoreAllVaultFiles(
  vaultId: string,
  outputDir: string,
): Promise<void> {
  return await ipc.client.vaults.restoreAllFiles({
    vaultId,
    outputDir,
  })
}

export async function getVaultFiles(
  vaultId: string,
  query?: string,
): Promise<string[]> {
  return await ipc.client.vaults.getFiles({ vaultId, query })
}

export async function hasSession(vaultId: string): Promise<boolean> {
  return await ipc.client.vaults.hasSession(vaultId)
}

export async function vaultExists(vaultId: string): Promise<boolean> {
  return await ipc.client.vaults.exists(vaultId)
}

export async function changeVaultLocation(
  vaultId: string,
  location: string,
): Promise<void> {
  return await ipc.client.vaults.changeLocation({ vaultId, location })
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

export async function changePassphrase(
  vaultId: string,
  oldPassphrase: string,
  newPassphrase: string,
) {
  return await ipc.client.vaults.changePassphrase({
    vaultId,
    oldPassphrase,
    newPassphrase,
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

export async function renameVault(vaultId: string, name: string) {
  return await ipc.client.vaults.rename({
    vaultId,
    name,
  })
}

export async function addExistingVault(vaultPath: string) {
  return await ipc.client.vaults.addExisting(vaultPath)
}

export async function getVaults(): Promise<VaultEntry[]> {
  return await ipc.client.vaults.get()
}
