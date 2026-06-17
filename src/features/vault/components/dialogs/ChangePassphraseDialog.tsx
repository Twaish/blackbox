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
} from '../../hooks/useChangePassphraseDialog'

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
        className="flex max-h-[70vh] max-w-md! flex-col gap-0 overflow-hidden p-0"
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
            <PassphraseField
              placeholder="Current passphrase"
              field="oldPassphrase"
            />
          </div>

          <div className="flex gap-1">
            <div className="flex w-full flex-col gap-0.5">
              <FieldTitle>New Passphrase</FieldTitle>
              <PassphraseField
                placeholder="New passphrase"
                field="newPassphrase"
              />
            </div>

            <div className="flex w-full flex-col gap-0.5">
              <FieldTitle>Confirm</FieldTitle>
              <ConfirmPassphraseField
                placeholder="Confirm passphrase"
                field="confirmNewPassphrase"
              />
            </div>
          </div>
          <ErrorIndicator />
        </div>
        <ChangePassphraseDialog.Footer />
      </DialogContent>
    </ChangePassphraseDialogContext.Provider>
  )
}

function ErrorIndicator() {
  const { store } = useChangePassphraseDialog()
  const isNewPassDefined = store((s) => !!s.draft.newPassphrase)
  const isSamePassword = store(isSamePasswordSelector)

  if (!isNewPassDefined || isSamePassword) return null

  return (
    <span className="text-destructive-foreground text-xs">
      Passwords do not match
    </span>
  )
}

function ConfirmPassphraseField({
  ...props
}: ComponentProps<typeof PassphraseField>) {
  return <PassphraseField {...props} />
}

function PassphraseField({
  field,
  className,
  ...props
}: { field: keyof PassphraseChange } & ComponentProps<'input'>) {
  const { store } = useChangePassphraseDialog()

  const value = store((s) => s.draft[field])
  const update = store((s) => s.update)

  const [show, setShow] = useState(false)

  return (
    <div className="flex h-8 w-full items-center border text-sm">
      <div className="flex items-center justify-center px-2">
        <KeyRound className="text-muted-foreground h-3 w-3" />
      </div>

      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => update({ [field]: e.target.value })}
        className={cn(
          'h-full w-full font-mono text-xs outline-none',
          className,
        )}
        {...props}
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
      console.log(`Something went wrong changing vault passphrase`, err)
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
