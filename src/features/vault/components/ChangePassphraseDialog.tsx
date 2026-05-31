import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from 'radix-ui'
import { ComponentProps, createContext, useContext, useState } from 'react'
import { DialogFooterHint } from '@/components/dialog/DialogFooterHint'
import { cn } from '@/utils/tailwind'
import { UseBoundStore, StoreApi } from 'zustand'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  closeChangePassphraseDialog,
  PassphraseChange,
} from '../hooks/useChangePassphraseDialog'

type State = {
  draft: PassphraseChange
  update(patch: Partial<PassphraseChange>): void
}
type Store = UseBoundStore<StoreApi<State>>

type ChangePassphraseDialogContextType = {
  store: Store
  onSubmit?: (vault: PassphraseChange) => Promise<void>
}

const ChangePassphraseDialogContext =
  createContext<ChangePassphraseDialogContextType | null>(null)

function useChangePassphraseDialog() {
  const ctx = useContext(ChangePassphraseDialogContext)
  if (!ctx) {
    throw new Error(
      'useChangePassphraseDialog must be used within ChangePassphraseDialog',
    )
  }
  return ctx
}

export function ChangePassphraseDialog({
  store,
  onSubmit,
}: ChangePassphraseDialogContextType) {
  return (
    <ChangePassphraseDialogContext.Provider value={{ store, onSubmit }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[70vh] flex-col gap-0 overflow-hidden p-0"
      >
        <VisuallyHidden.Root>
          <DialogTitle>Change vault passphrase</DialogTitle>
          <DialogDescription className="mb-2">
            Change the passphrase of the vault
          </DialogDescription>
        </VisuallyHidden.Root>
        <div className="flex flex-col gap-2 p-2">
          <div className="flex flex-col gap-0.5">
            <FieldTitle>Old Passphrase</FieldTitle>
            <PassphraseField field="oldPassphrase" />
          </div>

          <div className="flex flex-col gap-0.5">
            <FieldTitle>New Passphrase</FieldTitle>
            <PassphraseField field="newPassphrase" />
          </div>

          <div className="flex flex-col gap-0.5">
            <FieldTitle>Confirm Passphrase</FieldTitle>
            <ConfirmPassphraseField field="confirmNewPassphrase" />
          </div>
        </div>
        <ChangePassphraseDialog.Footer />
      </DialogContent>
    </ChangePassphraseDialogContext.Provider>
  )
}

function ConfirmPassphraseField({
  ...props
}: ComponentProps<typeof PassphraseField>) {
  const { store } = useChangePassphraseDialog()
  const isNewPassDefined = store((s) => !!s.draft.newPassphrase)
  const isSamePassword = store(isSamePasswordSelector)
  return (
    <>
      <PassphraseField {...props} />
      {isNewPassDefined && !isSamePassword && (
        <span className="text-destructive-foreground text-xs">
          Passwords do not match
        </span>
      )}
    </>
  )
}

function PassphraseField({ field }: { field: keyof PassphraseChange }) {
  const { store } = useChangePassphraseDialog()

  const value = store((s) => s.draft[field])
  const update = store((s) => s.update)

  const [show, setShow] = useState(false)

  return (
    <div className="flex h-8 w-full items-center rounded-md border text-sm">
      <div className="flex items-center justify-center px-2">
        <KeyRound className="text-muted-foreground h-3 w-3" />
      </div>

      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => update({ [field]: e.target.value })}
        placeholder="e.g. securepass123"
        className="h-full w-full font-mono text-xs outline-none"
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="flex aspect-square h-full items-center justify-center px-2"
      >
        {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </button>
    </div>
  )
}

ChangePassphraseDialog.Footer = function Footer() {
  const { store, onSubmit } = useChangePassphraseDialog()
  const hasBothPassphrases = store(
    (s) => s.draft.newPassphrase?.trim() && s.draft.oldPassphrase?.trim(),
  )
  const isNewPassDefined = store((s) => !!s.draft.newPassphrase)
  const isSamePassword = store(isSamePasswordSelector)

  const submit = async () => {
    try {
      const passphrases = store.getState().draft
      if (!passphrases.oldPassphrase?.trim()) return
      if (!passphrases.newPassphrase?.trim()) return
      await onSubmit?.(passphrases)
      closeChangePassphraseDialog()
    } catch (err) {
      console.log(`Something went wrong changing vault passphrase`)
    }
  }

  return (
    <DialogFooter>
      <DialogFooterHint text="close">Esc</DialogFooterHint>
      <div className="flex-1"></div>
      <Button
        onClick={submit}
        disabled={!hasBothPassphrases || (isNewPassDefined && !isSamePassword)}
      >
        Change passphrase
      </Button>
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

function isSamePasswordSelector(s: State) {
  return (
    s.draft.newPassphrase.trim() &&
    s.draft.confirmNewPassphrase === s.draft.newPassphrase
  )
}
