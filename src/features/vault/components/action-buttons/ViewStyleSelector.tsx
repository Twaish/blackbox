import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { useSettingsStore, VIEW_STYLES } from '../../stores/useSettingsStore'

export function ViewStyleSelector() {
  const viewStyle = useSettingsStore((s) => s.viewStyle)
  const setViewStyle = useSettingsStore((s) => s.setViewStyle)
  return (
    <Select value={viewStyle} onValueChange={setViewStyle}>
      <SelectTrigger className="h-min max-h-min rounded-none border-0 p-0 font-mono text-xs">
        {viewStyle}
      </SelectTrigger>
      <SelectContent>
        {VIEW_STYLES.map((viewStyle) => (
          <SelectItem key={viewStyle} value={viewStyle}>
            {viewStyle}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
