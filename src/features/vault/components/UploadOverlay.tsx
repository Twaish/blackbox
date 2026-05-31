import { useEffect, useState } from 'react'
import { useVaultStore } from '../stores/useVaultStore'
import { useUploadVaultFileStream } from '../mutations'
import { useQuery } from '@tanstack/react-query'
import { hasSessionQueryOptions } from '../queries'

export function UploadOverlay() {
  const [isDragging, setIsDragging] = useState(false)
  const vaultId = useVaultStore((s) => s.selectedVaultId)
  const { data: hasSession } = useQuery(hasSessionQueryOptions(vaultId ?? ''))
  const { mutate: upload } = useUploadVaultFileStream(vaultId ?? '')

  const enabled = !!vaultId && !!hasSession

  useEffect(() => {
    if (!enabled) return

    let dragCounter = 0

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter++

      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true)
      }
    }

    const onPaste = async (e: ClipboardEvent) => {
      if (!vaultId) return

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile()

          if (file) {
            upload(file)
          }
        }
      }
    }

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter--

      if (dragCounter === 0) {
        setIsDragging(false)
      }
    }

    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const onDrop = async (e: DragEvent) => {
      e.preventDefault()
      dragCounter = 0
      setIsDragging(false)

      const files = e.dataTransfer?.files
      if (!files || files.length === 0 || !vaultId) return

      for (const file of files) {
        upload(file)
      }
    }

    window.addEventListener('paste', onPaste)
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)

    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('paste', onPaste)
    }
  }, [vaultId, enabled])

  if (!enabled || !isDragging) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <p className="text-md">Drop files to upload</p>
        <p className="text-muted-foreground text-xs">Release to add to vault</p>
      </div>
    </div>
  )
}
