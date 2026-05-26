import { ReactNode, Suspense } from 'react'
import DragWindowRegion from '@/app/window/components/DragWindowRegion'
import { useQuery } from '@tanstack/react-query'
import { getAppName } from '@/app/instance/actions'
import { VaultSelector } from '@/features/vault/components/VaultSelector'
import { UploadFileButton } from '@/features/vault/components/action-buttons/UploadFileButton'
import { SettingsButton } from '@/features/vault/components/action-buttons/SettingsButton'
import { TasksButton } from '@/app/tasks/components/TasksButton'

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
        <TasksButton />
        <SettingsButton />
      </DragWindowRegion>
      <main className="relative h-full w-full overflow-hidden">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  )
}
