import { Plus } from 'lucide-react'
import { useAddVaultDialog } from '../../hooks/useAddVaultDialog'
import { ToolbarButton } from '../ui/ToolbarButton'
import { useCreateVault } from '../../mutations'
import { ComponentProps } from 'react'
import { cn } from '@/utils/tailwind'

export function AddVaultButton({
  className,
  ...props
}: ComponentProps<typeof ToolbarButton>) {
  const { mutate, isPending } = useCreateVault()
  const { add } = useAddVaultDialog({
    onAdd: mutate,
  })

  return (
    <ToolbarButton
      className={cn('px-2', className)}
      title="Create new vault"
      disabled={isPending}
      onClick={add}
      {...props}
    >
      <Plus className="h-3 w-3" />
      new
    </ToolbarButton>
  )
}
