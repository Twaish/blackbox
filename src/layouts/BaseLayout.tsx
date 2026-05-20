import { ReactNode, Suspense } from 'react'
import DragWindowRegion from '@/app/window/components/DragWindowRegion'
import { useQuery } from '@tanstack/react-query'
import { getAppName } from '@/app/instance/actions'
import { VaultSelector } from '@/features/vault/components/VaultSelector'
import { UploadFileButton } from '@/features/vault/components/action-buttons/UploadFileButton'

export default function BaseLayout({ children }: { children: ReactNode }) {
  const { data: appName } = useQuery({
    queryKey: ['appName'],
    queryFn: getAppName,
    staleTime: Infinity,
  })

  return (
    <div className="relative flex flex-[1_1_auto] flex-col overflow-hidden">
      <DragWindowRegion title={appName}>
        <UploadFileButton />
        <VaultSelector />
      </DragWindowRegion>
      <main className="relative h-full w-full">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  )
}
