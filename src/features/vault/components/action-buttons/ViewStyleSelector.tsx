import { useSettingsStore } from '../../stores/useSettingsStore'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/utils/tailwind'

export function ViewStyleSelector() {
  const viewStyle = useSettingsStore((s) => s.viewStyle)
  const setViewStyle = useSettingsStore((s) => s.setViewStyle)
  return (
    <div className="flex border">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setViewStyle('grid')}
        className={cn('rounded-none', viewStyle === 'grid' && 'bg-muted')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setViewStyle('list')}
        className={cn('rounded-none', viewStyle === 'list' && 'bg-muted')}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
