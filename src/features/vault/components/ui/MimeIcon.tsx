import { Clapperboard, FileText, Music, File, FileImage } from 'lucide-react'
import { ComponentProps } from 'react'

export function MimeIcon({
  mimeType,
  ...props
}: { mimeType: string } & ComponentProps<'svg'>) {
  const isText =
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/pdf'

  let Icon = File
  if (isText) {
    Icon = FileText
  } else if (mimeType.startsWith('video/')) {
    Icon = Clapperboard
  } else if (mimeType.startsWith('audio/')) {
    Icon = Music
  } else if (mimeType.startsWith('image/')) {
    Icon = FileImage
  }

  return <Icon {...props} />
}
