import { UploadOverlay } from '@/features/vault/components/UploadOverlay'
import { VaultFiles } from '@/features/vault/components/VaultFiles'

export default function VaultPage() {
  return (
    <div className="hide-scroll flex h-full flex-1 flex-col overflow-auto">
      <VaultFiles />
      <UploadOverlay />
    </div>
  )
}
