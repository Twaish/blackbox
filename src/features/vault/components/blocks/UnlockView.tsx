import { ComponentProps, useRef, useState } from 'react'
import { KeyRound, EyeOff, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUnlockVault } from '../../mutations'
import { EmptyIndicator } from '../ui/EmptyIndicator'
import { useVaultFiles } from '../../contexts/useVaultFiles'
import { cn } from '@/utils/tailwind'

export function UnlockView() {
  const vaultId = useVaultFiles()
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate, isPending, isError } = useUnlockVault(vaultId)

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const passphrase = new FormData(e.currentTarget).get('passphrase') as string
    if (!passphrase.trim()) return

    mutate(passphrase, {
      onSuccess: () => {
        if (inputRef.current) inputRef.current.value = ''
      },
    })
  }

  return (
    <EmptyIndicator>
      <EmptyIndicator.Content>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 [&:has(input:placeholder-shown)_button[type=submit]]:pointer-events-none [&:has(input:placeholder-shown)_button[type=submit]]:opacity-50"
        >
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5 font-mono text-xs uppercase">
              Passphrase
            </span>
            <UnlockView.PassField ref={inputRef} />
            {isError && (
              <div className="text-destructive-foreground text-xs select-none">
                Incorrect passphrase. Please try again.
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full select-none"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlocking...
              </>
            ) : (
              'Unlock'
            )}
          </Button>
        </form>
      </EmptyIndicator.Content>
    </EmptyIndicator>
  )
}

UnlockView.PassField = function PassField({
  className,
  ...props
}: ComponentProps<'input'>) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex h-8 w-full items-center border text-sm">
      <div className="flex items-center justify-center px-2">
        <KeyRound className="text-muted-foreground h-3 w-3" />
      </div>
      <input
        name="passphrase"
        type={show ? 'text' : 'password'}
        placeholder="Enter passphrase"
        className={cn(
          'h-full w-full font-mono text-xs outline-none',
          className,
        )}
        {...props}
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
