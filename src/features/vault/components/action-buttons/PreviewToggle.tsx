import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '../../stores/useSettingsStore'

export function PreviewToggle() {
  const shouldPreview = useSettingsStore((s) => s.shouldPreview) ?? true
  const setShouldPreview = useSettingsStore((s) => s.setShouldPreview)

  return <Switch checked={shouldPreview} onCheckedChange={setShouldPreview} />
}
