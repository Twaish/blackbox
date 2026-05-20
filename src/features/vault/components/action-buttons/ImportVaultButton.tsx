import { ComponentProps } from 'react'
import { FolderInput } from 'lucide-react'
import { selectFolder } from '@/app/instance/actions'
import { cn } from '@/utils/tailwind'
import { useImportVault } from '../../mutations'
import { ToolbarButton } from '../ui/ToolbarButton'

export function ImportVaultButton({
  className,
  ...props
}: ComponentProps<typeof ToolbarButton>) {
  const { mutate, isPending } = useImportVault()
  const handleImport = async () => {
    const folder = await selectFolder()
    if (folder) mutate(folder)
  }

  return (
    <ToolbarButton
      title="Import existing vault"
      disabled={isPending}
      onClick={handleImport}
      className={cn('px-2', className)}
      {...props}
    >
      <FolderInput className="h-3 w-3" />
      import
    </ToolbarButton>
  )
}
