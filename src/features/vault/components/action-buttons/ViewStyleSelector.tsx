import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { VIEW_STYLES } from '../../actions'
import { useQuery } from '@tanstack/react-query'
import { viewStyleQueryOptions } from '../../queries'
import { useSetViewStyle } from '../../mutations'

export function ViewStyleSelector() {
  const { data: viewStyle } = useQuery(viewStyleQueryOptions())
  const { mutate: setViewStyle } = useSetViewStyle()
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
