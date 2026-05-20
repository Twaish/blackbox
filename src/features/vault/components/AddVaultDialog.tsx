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

type Store = UseBoundStore<
  StoreApi<{
    draft: Partial<CreateVaultDTO>
    update(patch: Partial<CreateVaultDTO>): void
    reset: () => void
  }>
>

type AddVaultDialogContextType = {
  store: Store
  onAdd?: (vault: Partial<CreateVaultDTO>) => void
}

const AddVaultDialogContext = createContext<AddVaultDialogContextType | null>(
  null,
)

function useAddVaultDialog() {
  const ctx = useContext(AddVaultDialogContext)
  if (!ctx) {
    throw new Error('useAddVaultDialog must be used within AddVaultDialog')
  }
  return ctx
}

export function AddVaultDialog({ store, onAdd }: AddVaultDialogContextType) {
  return (
    <AddVaultDialogContext.Provider value={{ store, onAdd }}>
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
            <FieldTitle>Location</FieldTitle>
            <AddVaultDialog.LocationInput />
          </div>

          <div className="flex flex-col gap-0.5">
            <FieldTitle>Name</FieldTitle>
            <AddVaultDialog.NameInput />
          </div>

          <div className="flex flex-col gap-0.5">
            <FieldTitle>Passphrase</FieldTitle>
            <AddVaultDialog.PassInput />
          </div>
        </div>
        <AddVaultDialog.Footer />
      </DialogContent>
    </AddVaultDialogContext.Provider>
  )
}

AddVaultDialog.LocationInput = function LocationInput() {
  const { store } = useAddVaultDialog()
  const location = store((s) => s.draft.location)
  const update = store((s) => s.update)

  const handleChange = (location: string) => {
    update({ location })
  }

  const pickFolder = async () => {
    const location = await selectFolder()
    if (!location) return

    update({ location })
  }

  return (
    <div className="flex h-8 items-center rounded-md border">
      <input
        value={location ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="D:/Secure/PersonalVault"
        className="w-full px-2 text-sm outline-none"
      />
      <button
        title="Select folder"
        onClick={pickFolder}
        className="text-secondary-foreground/50 hover:text-secondary-foreground flex h-8 w-8 items-center justify-center"
      >
        <Folder className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

AddVaultDialog.NameInput = function NameInput() {
  const { store } = useAddVaultDialog()
  const location = store((s) => s.draft.location)
  const name = store((s) => s.draft.name)
  const update = store((s) => s.update)

  const handleChange = (name: string) => {
    update({ name })
  }

  return (
    <>
      <div className="flex h-8 items-center rounded-md border">
        <input
          value={name ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Personal"
          className="w-full px-2 text-sm outline-none"
        />
      </div>

      {name && location && (
        <span className="text-muted-foreground text-xs">
          Final location: {`${location.replaceAll('\\', '/')}/${name}`}
        </span>
      )}
    </>
  )
}

AddVaultDialog.PassInput = function PassInput() {
  const { store } = useAddVaultDialog()
  const passphrase = store((s) => s.draft.passphrase)
  const update = store((s) => s.update)
  const [show, setShow] = useState(false)

  const handleChange = (passphrase: string) => {
    update({ passphrase })
  }

  return (
    <div className="flex h-8 w-full items-center rounded-md border text-sm">
      <div className="flex items-center justify-center px-2">
        <KeyRound className="text-muted-foreground h-3 w-3" />
      </div>
      <input
        type={show ? 'text' : 'password'}
        value={passphrase}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="e.g. securepass123"
        className="h-full w-full font-mono text-xs outline-none"
      />
      <div
        onClick={() => setShow(!show)}
        className="flex aspect-square h-full cursor-pointer items-center justify-center px-2 select-none"
      >
        {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </div>
    </div>
  )
}

AddVaultDialog.Footer = function Footer() {
  const { store, onAdd } = useAddVaultDialog()

  const add = () => {
    try {
      onAdd?.(store.getState().draft)
      closeAddVaultDialog()
    } catch (err) {
      console.log(`Something went wrong creating vault`)
    }
  }

  return (
    <DialogFooter>
      <DialogFooterHint text="close">Esc</DialogFooterHint>
      <div className="flex-1"></div>
      <Button onClick={add}>Create vault</Button>
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
