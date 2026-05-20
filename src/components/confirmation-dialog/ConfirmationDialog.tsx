import { ReactNode } from 'react'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { DialogFooterHint } from '../dialog/DialogFooterHint'

export function ConfirmationDialog({
  onConfirm,
  children,
  title = 'Confirm this action?',
  description = 'Are you sure you want to do this?',
}: {
  onConfirm?: () => void
  children?: ReactNode
  title?: string
  description?: string
}) {
  return (
    <DialogContent className="gap-0 p-0">
      <DialogHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </div>
        <DialogDescription className="text-muted-foreground mt-1">
          {description}
        </DialogDescription>
        {children}
      </DialogHeader>
      <DialogFooter className="gap-2">
        <DialogFooterHint text="close">Esc</DialogFooterHint>
        <div className="flex-1"></div>
        <DialogClose asChild>
          <Button variant={'secondary'}>cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button onClick={onConfirm}>confirm</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}
