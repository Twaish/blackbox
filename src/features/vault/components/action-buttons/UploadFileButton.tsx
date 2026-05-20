import { Upload } from 'lucide-react'
import { selectFile } from '@/app/instance/actions'
import { useUploadVaultFile } from '../../mutations'
import { useVaultStore } from '../../stores/useVaultStore'
import { ToolbarButton } from '../ui/ToolbarButton'
import { useQuery } from '@tanstack/react-query'
import { hasSessionQueryOptions } from '../../queries'

export function UploadFileButton() {
  const vaultId = useVaultStore((s) => s.selectedVaultId)
  const { data: hasSession } = useQuery({
    ...hasSessionQueryOptions(vaultId!),
    enabled: !!vaultId,
  })
  const { mutate } = useUploadVaultFile(vaultId ?? '')

  if (!vaultId || !hasSession) return

  const handleUpload = async () => {
    const filepath = await selectFile()
    if (filepath) mutate(filepath)
  }

  return (
    <ToolbarButton className="px-2" title="Upload file" onClick={handleUpload}>
      <Upload className="h-3 w-3" />
      Upload
    </ToolbarButton>
  )
}
