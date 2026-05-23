import { useState } from 'react'
import { KeyRound, EyeOff, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUnlockVault } from '../../mutations'
import { EmptyIndicator } from '../ui/EmptyIndicator'
import { useVaultFiles } from '../../contexts/useVaultFiles'

export function UnlockView() {
  const vaultId = useVaultFiles()
  const [passphrase, setPassphrase] = useState('')
  const [show, setShow] = useState(false)
  const { mutate, isPending, isError } = useUnlockVault(vaultId)

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!passphrase.trim()) return

    mutate(passphrase, {
      onSuccess: () => setPassphrase(''),
    })
  }

  return (
    <EmptyIndicator>
      <EmptyIndicator.Content>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-muted-foreground mb-0.5 font-mono text-xs uppercase">
              Passphrase
            </span>
            <div className="flex h-8 w-full items-center rounded-md border text-sm">
              <div className="flex items-center justify-center px-2">
                <KeyRound className="text-muted-foreground h-3 w-3" />
              </div>
              <input
                type={show ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="e.g. securepass123"
                className="h-full w-full font-mono text-xs outline-none"
              />
              <div
                onClick={() => setShow(!show)}
                className="flex aspect-square h-full cursor-pointer items-center justify-center px-2 select-none"
              >
                {show ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </div>
            </div>
            {isError && (
              <div className="text-destructive-foreground text-xs">
                Incorrect passphrase. Please try again.
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !passphrase.trim()}
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
