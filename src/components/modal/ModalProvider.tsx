import { ReactNode, useRef } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { useModalStore } from './useModalStore'

export function ModalProvider() {
  const { isOpen, content, close } = useModalStore()

  const lastContent = useRef<ReactNode>(null)
  if (content !== null) lastContent.current = content

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      {content}
    </Dialog>
  )
}
export { useModalStore }
