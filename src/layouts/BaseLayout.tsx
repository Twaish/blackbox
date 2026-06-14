import { ReactNode, Suspense } from 'react'
import DragWindowRegion from '@/app/window/components/DragWindowRegion'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getAppName } from '@/app/instance/actions'
import { VaultSelector } from '@/features/vault/components/VaultSelector'
import { UploadFileButton } from '@/features/vault/components/action-buttons/UploadFileButton'
import { SettingsButton } from '@/features/vault/components/action-buttons/SettingsButton'
import { TasksButton } from '@/app/tasks/components/TasksButton'
import { FileSearchField } from '@/features/vault/components/blocks/FileSearchField'
import logo from '@assets/icon32x32.png'

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
  return (
    <DragWindowRegion>
      <AppLogo />
      <AppName />
      <FileSearchField />
      <UploadFileButton />
      <VaultSelector />
      <TasksButton />
      <SettingsButton />
    </DragWindowRegion>
  )
}

function AppLogo() {
  return (
    <img
      alt="logo"
      src={logo}
      height={24}
      width={24}
      className="ml-1 max-h-6 pr-1 pl-1"
    />
  )
}

function AppName() {
  const { data: appName } = useSuspenseQuery({
    queryKey: ['appName'],
    queryFn: getAppName,
    staleTime: Infinity,
  })

  if (!appName) return

  return (
    <>
      <title>{appName}</title>
      <div className="mr-auto flex pr-1 text-xs whitespace-nowrap opacity-65 select-none">
        {appName}
      </div>
    </>
  )
}
