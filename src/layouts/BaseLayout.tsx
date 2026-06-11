import { ReactNode, Suspense } from 'react'
import DragWindowRegion from '@/app/window/components/DragWindowRegion'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getAppName } from '@/app/instance/actions'
import { VaultSelector } from '@/features/vault/components/VaultSelector'
import { UploadFileButton } from '@/features/vault/components/action-buttons/UploadFileButton'
import { SettingsButton } from '@/features/vault/components/action-buttons/SettingsButton'
import { TasksButton } from '@/app/tasks/components/TasksButton'
import { FileSearchField } from '@/features/vault/components/blocks/FileSearchField'

export default function BaseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-[1_1_auto] flex-col overflow-hidden">
      <TitleBar />
      <main className="relative h-full w-full overflow-hidden">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  )
}

function TitleBar() {
  const { data: appName } = useSuspenseQuery({
    queryKey: ['appName'],
    queryFn: getAppName,
    staleTime: Infinity,
  })

  return (
    <DragWindowRegion title={appName}>
      <FileSearchField />
      <UploadFileButton />
      <VaultSelector />
      <TasksButton />
      <SettingsButton />
    </DragWindowRegion>
  )
}
