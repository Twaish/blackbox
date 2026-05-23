import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMutation } from '@tanstack/react-query'
import { VisuallyHidden } from 'radix-ui'
import { ComponentProps, createContext, useContext, useState } from 'react'
import { DialogFooterHint } from '@/components/dialog/DialogFooterHint'
import { selectFolder } from '@/app/instance/actions'
import { createVault, addExistingVault } from '../actions'
import { cn } from '@/utils/tailwind'
import { UseBoundStore, StoreApi } from 'zustand'
import { Eye, EyeClosed, EyeOff, Folder, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { closeAddVaultDialog } from '../hooks/useAddVaultDialog'
import { closeRenameVaultDialog } from '../hooks/useRenameVaultDialog'

type Store = UseBoundStore<
  StoreApi<{
    name: string
    update(name: string): void
  }>
>

type RenameVaultDialogContextType = {
  store: Store
  onRename?: (name: string) => void
}

const RenameVaultDialogContext =
  createContext<RenameVaultDialogContextType | null>(null)

function useRenameVaultDialog() {
  const ctx = useContext(RenameVaultDialogContext)
  if (!ctx) {
    throw new Error(
      'useRenameVaultDialog must be used within RenameVaultDialog',
    )
  }
  return ctx
}

export function RenameVaultDialog({
  onRename,
  store,
}: RenameVaultDialogContextType) {
  return (
    <RenameVaultDialogContext.Provider value={{ store, onRename }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[70vh] flex-col gap-0 overflow-hidden p-0"
      >
        <VisuallyHidden.Root>
          <DialogTitle>Create vault</DialogTitle>
          <DialogDescription className="mb-2">
            Vaults are folders containing encrypted files created by this app
          </DialogDescription>
        </VisuallyHidden.Root>
        <div className="flex flex-col gap-2 p-2">
          <div className="flex flex-col gap-0.5">
            <FieldTitle>Name</FieldTitle>
            <RenameVaultDialog.NameInput />
          </div>
        </div>
        <RenameVaultDialog.Footer />
      </DialogContent>
    </RenameVaultDialogContext.Provider>
  )
}

RenameVaultDialog.NameInput = function NameInput() {
  const { store } = useRenameVaultDialog()
  const name = store((s) => s.name)
  const update = store((s) => s.update)

  const handleChange = (name: string) => {
    update(name)
  }

  return (
    <>
      <div className="flex h-8 items-center rounded-md border">
        <input
          value={name}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Personal"
          className="w-full px-2 text-sm outline-none"
        />
      </div>
    </>
  )
}

RenameVaultDialog.Footer = function Footer() {
  const { onRename, store } = useRenameVaultDialog()

  const rename = () => {
    try {
      onRename?.(store.getState().name)
      closeRenameVaultDialog()
    } catch (err) {
      console.log(`Something went wrong renaming vault`)
    }
  }

  return (
    <DialogFooter>
      <DialogFooterHint text="close">Esc</DialogFooterHint>
      <div className="flex-1"></div>
      <Button onClick={rename}>Rename vault</Button>
    </DialogFooter>
  )
}

function FieldTitle({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <span
      className={cn(
        'text-muted-foreground font-mono text-xs uppercase',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
