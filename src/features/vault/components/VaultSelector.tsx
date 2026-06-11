import { ComponentProps, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/tailwind'
import { useVaultStore } from '../stores/useVaultStore'
import { getVaultsQueryOptions } from '../queries'
import {
  ArrowRightFromLine,
  ChevronDown,
  FolderOpen,
  FolderPen,
  Hash,
  Lock,
  LockOpen,
  LogOut,
  MoreHorizontal,
  Unlink,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AddVaultButton } from './action-buttons/AddVaultButton'
import { ImportVaultButton } from './action-buttons/ImportVaultButton'
import { Highlight } from '@/components/Highlight'
import { create } from 'zustand'
import { openFolder, selectFolder } from '@/app/instance/actions'
import {
  useChangePassphrase,
  useRemoveSession,
  useRenameVault,
  useUnlinkVault,
} from '../mutations'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConfirmationDialog } from '@/components/confirmation-dialog/useConfirmationDialog'
import { useRenameVaultDialog } from '../hooks/useRenameVaultDialog'
import { restoreAllVaultFiles } from '../actions'
import { useChangePassphraseDialog } from '../hooks/useChangePassphraseDialog'
import { SearchField } from './ui/SearchField'
import { useHasVaultSession } from '../hooks/useHasVaultSession'

type VaultSelectorStore = {
  query: string
  setQuery: (query: string) => void
}

const useVaultSelectorStore = create<VaultSelectorStore>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
}))

export function VaultSelector({
  ...props
}: ComponentProps<typeof PopoverTrigger>) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger {...props} asChild>
        <VaultSelector.SelectedVault
          className={cn(open && 'bg-secondary/50')}
        />
      </PopoverTrigger>
      <PopoverContent
        align={'end'}
        className="flex min-w-80 flex-col gap-0 p-0"
      >
        <VaultSelector.SearchField />
        <VaultSelector.Items />
        <div className="flex h-8 border-t">
          <AddVaultButton className="w-full" />
          <ImportVaultButton className="w-full" />
        </div>
      </PopoverContent>
    </Popover>
  )
}
VaultSelector.SelectedVault = function SelectedVault({
  className,
  ...props
}: ComponentProps<'button'>) {
  const { data: vaults, isLoading } = useQuery(getVaultsQueryOptions())

  const selectedVaultId = useVaultStore((s) => s.selectedVaultId)
  const setSelectedVault = useVaultStore((s) => s.setSelectedVault)

  const vault = useMemo(
    () => vaults?.find((v) => v.id === selectedVaultId),
    [vaults, selectedVaultId],
  )

  useEffect(() => {
    if (isLoading) return

    if (!vaults?.length) {
      if (selectedVaultId !== null) {
        setSelectedVault(null)
      }
      return
    }

    const exists = vaults.some((v) => v.id === selectedVaultId)

    if (!exists) {
      setSelectedVault(vaults[0].id)
    }
  }, [isLoading, vaults, selectedVaultId, setSelectedVault])

  return (
    <button
      className={cn(
        'no-drag focus-visible:bg-secondary/50 hover:bg-secondary/50 flex h-full w-auto items-center gap-1 px-2 text-xs outline-none select-none focus-visible:ring-0',
        className,
      )}
      {...props}
    >
      {vault?.id && <SessionIndicator vaultId={vault.id} />}
      {vault?.name ?? 'Select vault'}
      <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
    </button>
  )
}

VaultSelector.SearchField = function VaultSearchField() {
  const query = useVaultSelectorStore((s) => s.query)
  const setQuery = useVaultSelectorStore((s) => s.setQuery)
  return (
    <SearchField className="w-full border-b">
      <SearchField.Icon />
      <SearchField.Input
        autoFocus
        spellCheck={false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search vaults..."
        className="w-full"
      />
    </SearchField>
  )
}

VaultSelector.Items = function Items() {
  const { data: vaults, isLoading } = useQuery(getVaultsQueryOptions())
  const setSelectedVault = useVaultStore((s) => s.setSelectedVault)
  const query = useVaultSelectorStore((s) => s.query)

  const filteredVaults = useMemo(() => {
    if (!vaults?.length) return []

    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return vaults

    return vaults.filter((vault) =>
      vault.name.toLowerCase().includes(normalizedQuery),
    )
  }, [vaults, query])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className={cn(
          'hide-scroll h-full max-h-50 w-full overflow-auto',
          filteredVaults.length && 'pb-10',
        )}
      >
        {isLoading ? (
          <div>Loading...</div>
        ) : filteredVaults.length ? (
          filteredVaults.map((vault) => (
            <VaultItem
              key={vault.id}
              vault={vault}
              onClick={() => setSelectedVault(vault.id)}
            />
          ))
        ) : (
          <div className="text-muted-foreground flex items-center justify-center px-2 py-12 text-xs">
            No vaults found
          </div>
        )}
      </div>

      <div className="from-background via-background/90 pointer-events-none absolute right-0 bottom-0 left-0 h-12 bg-linear-to-t via-40% to-transparent" />
    </div>
  )
}

function VaultItem({
  vault,
  className,
  children,
  onClick,
  ...props
}: {
  vault: VaultEntry
} & ComponentProps<'div'>) {
  const selected = useVaultStore((s) => s.selectedVaultId === vault.id)

  return (
    <div
      tabIndex={0}
      className={cn(
        'hover:bg-secondary/20 focus-visible:bg-secondary/50 flex w-full items-center px-2 py-1 outline-none',
        selected && 'bg-secondary/35 border-primary border-l',
        className,
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(e as any)
        }
      }}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="flex w-full flex-col items-start">
          <div className="flex w-full items-center gap-1">
            <VaultItem.Title text={vault.name} />
            <SessionIndicator vaultId={vault.id} />
          </div>

          <span className="text-muted-foreground text-[11px]">
            {vault.location}
          </span>
        </div>
      </div>

      <VaultItem.Options vault={vault} />
    </div>
  )
}
VaultItem.Title = function Title({ text }: { text: string }) {
  const query = useVaultSelectorStore((s) => s.query)
  return (
    <span className="font-mono text-xs">
      <Highlight text={text} term={query} />
    </span>
  )
}
VaultItem.Options = function Options({ vault }: { vault: VaultEntry }) {
  const [open, setOpen] = useState(false)
  const { mutate: unlinkVault } = useUnlinkVault()
  const { mutate: renameVault } = useRenameVault(vault.id)
  const { mutate: removeSession } = useRemoveSession(vault.id)
  const { mutateAsync: changePassphrase } = useChangePassphrase(vault.id)
  const { hasSession } = useHasVaultSession(vault.id)
  const { confirm: confirmUnlink } = useConfirmationDialog({
    onConfirm: () => {
      unlinkVault(vault.id ?? '')
      setOpen(false)
    },
    title: 'Unlink this vault?',
    description: 'This will only unregister your vault, not delete it.',
  })
  const { rename } = useRenameVaultDialog({
    onRename: (name) => renameVault(name),
    defaultName: vault.name,
  })
  const { changePassphrase: updatePassphrase } = useChangePassphraseDialog({
    onSubmit: async (passphrases) => changePassphrase(passphrases),
  })

  const handleOpenFolder = () => {
    openFolder(vault.location)
    setOpen(false)
  }

  const handleRemoveSession = () => {
    removeSession()
    setOpen(false)
  }

  const handleExportFiles = async () => {
    const outputDir = await selectFolder()
    if (!outputDir) return

    restoreAllVaultFiles(vault.id, outputDir)
    setOpen(false)
  }

  const handleRenameVault = async () => {
    rename()
    setOpen(false)
  }

  const handleChangePassphrase = async () => {
    updatePassphrase()
    setOpen(false)
  }

  const noProp =
    (callback?: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      callback?.()
    }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className="hover:bg-secondary/50 h-5 w-5 rounded p-1 select-none"
        onClick={noProp()}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="flex w-full min-w-20 flex-col"
      >
        <OptionButton onClick={noProp(handleRenameVault)}>
          <OptionButton.Icon>
            <FolderPen className="h-4 w-4" />
          </OptionButton.Icon>
          <OptionButton.Details>
            <OptionButton.Title>Rename vault</OptionButton.Title>
            <OptionButton.Description>
              Change the name of this vault
            </OptionButton.Description>
          </OptionButton.Details>
        </OptionButton>

        <OptionButton onClick={noProp(handleChangePassphrase)}>
          <OptionButton.Icon>
            <Hash className="h-4 w-4" />
          </OptionButton.Icon>
          <OptionButton.Details>
            <OptionButton.Title>Change passphrase</OptionButton.Title>
            <OptionButton.Description>
              Change the passphrase used to open this vault
            </OptionButton.Description>
          </OptionButton.Details>
        </OptionButton>

        <OptionButton onClick={noProp(handleOpenFolder)}>
          <OptionButton.Icon>
            <FolderOpen className="h-4 w-4" />
          </OptionButton.Icon>
          <OptionButton.Details>
            <OptionButton.Title>Open folder</OptionButton.Title>
            <OptionButton.Description>
              Open the vault location in file explorer
            </OptionButton.Description>
          </OptionButton.Details>
        </OptionButton>

        {hasSession && (
          <OptionButton onClick={noProp(handleExportFiles)}>
            <OptionButton.Icon>
              <ArrowRightFromLine className="h-4 w-4" />
            </OptionButton.Icon>
            <OptionButton.Details>
              <OptionButton.Title>Export files</OptionButton.Title>
              <OptionButton.Description>
                Export all files to a chosen folder
              </OptionButton.Description>
            </OptionButton.Details>
          </OptionButton>
        )}
        {hasSession && (
          <OptionButton onClick={noProp(handleRemoveSession)}>
            <OptionButton.Icon>
              <LogOut className="h-4 w-4" />
            </OptionButton.Icon>
            <OptionButton.Details>
              <OptionButton.Title>Remove session</OptionButton.Title>
              <OptionButton.Description>
                Removes the current session for this vault
              </OptionButton.Description>
            </OptionButton.Details>
          </OptionButton>
        )}
        <OptionButton onClick={noProp(confirmUnlink)}>
          <OptionButton.Icon>
            <Unlink className="h-4 w-4" />
          </OptionButton.Icon>
          <OptionButton.Details>
            <OptionButton.Title>Unlink vault</OptionButton.Title>
            <OptionButton.Description>
              Unregisters the vault from the app
            </OptionButton.Description>
          </OptionButton.Details>
        </OptionButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function OptionButton({
  className,
  children,
  ...props
}: ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'hover:bg-secondary/50 flex h-10 gap-2 px-2 py-1',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
OptionButton.Icon = function Icon({
  children,
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex h-full items-center justify-center', className)}
      {...props}
    >
      {children}
    </div>
  )
}
OptionButton.Details = function Details({
  className,
  children,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col items-start', className)} {...props}>
      {children}
    </div>
  )
}
OptionButton.Title = function Title({
  className,
  children,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span className={cn('text-xs', className)} {...props}>
      {children}
    </span>
  )
}
OptionButton.Description = function Description({
  className,
  children,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span className={cn('text-muted-foreground text-xs', className)} {...props}>
      {children}
    </span>
  )
}

function SessionIndicator({ vaultId }: { vaultId: string }) {
  const { hasSession } = useHasVaultSession(vaultId)
  return hasSession ? (
    <LockOpen className="h-3 w-3 text-green-400" />
  ) : (
    <Lock className="h-3 w-3 text-red-400" />
  )
}
