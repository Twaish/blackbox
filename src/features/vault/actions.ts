import { ipc } from '@/core/ipc'
import { consumeEventIterator } from '@orpc/client'

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

export async function readVaultFile(
  vaultId: string,
  fileId: string,
): Promise<{ type: 'Buffer'; data: Buffer }> {
  return await ipc.client.vaults.readFile({
    vaultId,
    fileId,
  })
}

export function streamVaultFile({
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
}): void {
  const chunks: Uint8Array[] | null = onDone ? [] : null
  const cancel = consumeEventIterator(
    ipc.client.vaults.streamFile({ vaultId, fileId }),
    {
      onEvent(chunk) {
        if (signal?.aborted) return
        chunk = Uint8Array.from(Object.values(chunk))
        chunks?.push(chunk)
        onChunk?.(chunk)
      },
      onError(err) {
        if ((err as Error)?.name === 'AbortError') return
        onError?.(err)
      },
      onSuccess() {
        if (signal?.aborted) return
        if (chunks) {
          const totalLength = chunks.reduce((n, c) => n + c.length, 0)
          const full = new Uint8Array(totalLength)
          let offset = 0
          for (const c of chunks) {
            full.set(c, offset)
            offset += c.length
          }
          onDone?.(new Blob([full]))
        }
      },
    },
  )
  if (signal) {
    if (signal.aborted) {
      cancel()
    } else {
      const onAbort = () => {
        cancel()
        signal.removeEventListener('abort', onAbort)
      }
      signal.addEventListener('abort', onAbort)
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

function readChunk(reader: FileReader, blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.readAsArrayBuffer(blob)
  })
}

export async function addVaultFileStream(vaultId: string, file: File) {
  const uploadId = await ipc.client.vaults.startUpload({
    vaultId,
    name: file.name,
    mime: file.type,
  })

  const reader = new FileReader()
  let offset = 0

  while (offset < file.size) {
    const blob = file.slice(offset, offset + CHUNK_SIZE)
    const arrayBuffer = await readChunk(reader, blob)

    await ipc.client.vaults.uploadChunk({
      uploadId,
      chunk: Array.from(new Uint8Array(arrayBuffer)),
    })

    offset += CHUNK_SIZE
  }

  return await ipc.client.vaults.finishUpload({
    uploadId,
  })
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
