import { ReactNode } from 'react'
import { ConfirmationDialog } from './ConfirmationDialog'
import { closeModal, openModal } from '../modal/useModalStore'

type useConfirmationDialogOptions = {
  onConfirm?: () => void
  content?: ReactNode
  title?: string
  description?: string
}

export const openConfirmationDialog = ({
  content,
  ...props
}: useConfirmationDialogOptions) => {
  openModal(<ConfirmationDialog {...props}>{content}</ConfirmationDialog>)
}

export const closeConfirmationDialog = () => {
  closeModal()
}

export function useConfirmationDialog(
  props: useConfirmationDialogOptions = {},
) {
  return { confirm: () => openConfirmationDialog(props) }
}
