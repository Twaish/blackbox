import { ComponentProps, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/tailwind'
import { useVaultStore } from '../stores/useVaultStore'
import { getVaultsQueryOptions, hasSessionQueryOptions } from '../queries'
import {
  ChevronDown,
  FolderOpen,
  Lock,
  LockOpen,
  LogOut,
  MoreHorizontal,
  Search,
  Trash2,
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
import { openFolder } from '@/app/instance/actions'
import { useRemoveSession, useUnlinkVault } from '../mutations'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConfirmationDialog } from '@/components/confirmation-dialog/useConfirmationDialog'

type VaultSelectorStore = {
  vault?: VaultEntry
  query: string
  setVault: (vault?: VaultEntry) => void
  setQuery: (query: string) => void
}

const useVaultSelectorStore = create<VaultSelectorStore>((set) => ({
  vault: undefined,
  query: '',
  setVault: (vault) => set({ vault }),
  setQuery: (query) => set({ query }),
}))

export function VaultSelector({
  ...props
}: ComponentProps<typeof PopoverTrigger>) {
  return (
    <Popover>
      <PopoverTrigger {...props} asChild>
        <VaultSelector.SelectedVault />
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
  const setSelectedVault = useVaultStore((s) => s.setSelectedVault)

  const vault = useVaultSelectorStore((s) => s.vault)
  const setVault = useVaultSelectorStore((s) => s.setVault)

  useEffect(() => {
    if (isLoading) return

    if (!vaults?.length) {
      setVault(undefined)
      setSelectedVault(null)
      return
    }

    // Set first available vault
    const stillExists = vaults.find((v) => v.id === vault?.id)
    if (!stillExists) {
      const nextVault = vaults[0]
      setVault(nextVault)
      setSelectedVault(nextVault.id)
    }
  }, [isLoading, vaults, vault?.id])

  return (
    <button
      className={cn(
        'no-drag focus-visible:bg-secondary/50 hover:bg-secondary/50 flex h-full w-auto items-center gap-1 px-2 text-xs outline-none select-none focus-visible:ring-0',
        // 'no-drag bg-secondary/25 hover:bg-secondary/50 flex w-auto items-center gap-1 rounded-md border px-2 py-1 text-xs outline-none select-none focus-visible:ring-0',
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

VaultSelector.SearchField = function SearchField() {
  const query = useVaultSelectorStore((s) => s.query)
  const setQuery = useVaultSelectorStore((s) => s.setQuery)
  return (
    <div className="flex h-8 w-full items-center gap-1 border-b px-2 py-1">
      <Search className="text-muted-foreground h-3.5 w-3.5" />
      <input
        autoFocus
        spellCheck={false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-sm outline-none"
        placeholder="Search vaults..."
      />
    </div>
  )
}

VaultSelector.Items = function Items() {
  const { data: vaults, isLoading } = useQuery(getVaultsQueryOptions())
  const setSelectedVault = useVaultStore((s) => s.setSelectedVault)
  const setVault = useVaultSelectorStore((s) => s.setVault)
  const query = useVaultSelectorStore((s) => s.query)

  const handleVaultChange = (vault: VaultEntry) => {
    setVault(vault)
    setSelectedVault(vault.id)
  }

  const filteredVaults = useMemo(() => {
    if (!vaults?.length) return []

    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return vaults

    return vaults.filter((vault) => {
      return (
        vault.name.toLowerCase().includes(normalizedQuery) ||
        vault.location.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [vaults, query])

  return (
    <div className="hide-scroll h-full max-h-40 w-full overflow-auto">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {filteredVaults.length ? (
            filteredVaults.map((vaultEntry) => (
              <VaultItem
                key={vaultEntry.id}
                vault={vaultEntry}
                onClick={() => handleVaultChange(vaultEntry)}
              />
            ))
          ) : (
            <div className="text-muted-foreground flex items-center justify-center px-2 py-12 text-xs">
              No vaults found
            </div>
          )}
        </>
      )}
    </div>
  )
}

function VaultItem({
  vault,
  className,
  children,
  onClick,
  ...props
}: { vault: VaultEntry } & ComponentProps<'div'>) {
  const selectedVault = useVaultSelectorStore((s) => s.vault)
  const query = useVaultSelectorStore((s) => s.query)

  return (
    <div
      tabIndex={0}
      className={cn(
        'hover:bg-secondary/20 focus-visible:bg-secondary/50 flex w-full items-center px-2 py-1 outline-none',
        selectedVault?.id === vault.id &&
          'bg-secondary/35 border-primary border-l',
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
            <span className="font-mono text-xs">
              <Highlight text={vault.name} term={query} />
            </span>
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
VaultItem.Options = function Options({ vault }: { vault: VaultEntry }) {
  const [open, setOpen] = useState(false)
  const { mutate: unlinkVault } = useUnlinkVault()
  const { mutate: removeSession } = useRemoveSession(vault.id)
  const { data: hasSession } = useQuery(hasSessionQueryOptions(vault.id))
  const { confirm: confirmUnlink } = useConfirmationDialog({
    onConfirm: () => {
      unlinkVault(vault.id ?? '')
      setOpen(false)
    },
    title: 'Unlink this vault?',
    description: 'This will only unregister your vault, not delete it.',
  })

  const handleOpenFolder = () => {
    openFolder(vault.location)
    setOpen(false)
  }

  const handleRemoveSession = () => {
    removeSession()
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
        'hover:bg-secondary/50 flex h-10 gap-2 rounded-md px-2 py-1',
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
  const { data: hasSession } = useQuery(hasSessionQueryOptions(vaultId))
  return hasSession ? (
    <LockOpen className="h-3 w-3 text-green-400" />
  ) : (
    <Lock className="h-3 w-3 text-red-400" />
  )
}
