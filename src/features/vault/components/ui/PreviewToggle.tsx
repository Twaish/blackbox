import { Switch } from '@/components/ui/switch'
import { useQuery } from '@tanstack/react-query'
import { useSetShouldPreview } from '../../mutations'
import { shouldPreviewQueryOptions } from '../../queries'

export function PreviewToggle() {
  const { mutate: setShouldPreview } = useSetShouldPreview()
  const { data: shouldPreview } = useQuery(shouldPreviewQueryOptions())

  return <Switch checked={shouldPreview} onCheckedChange={setShouldPreview} />
}
