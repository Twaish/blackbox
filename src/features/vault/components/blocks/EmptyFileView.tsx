import { Kbd } from '@/components/Kbd'
import { Upload, MousePointer2 } from 'lucide-react'
import { EmptyIndicator } from '../ui/EmptyIndicator'

export function EmptyFileView() {
  return (
    <EmptyIndicator>
      <EmptyIndicator.Content className="max-w-md">
        <EmptyIndicator.Description className="text-center">
          No files yet
        </EmptyIndicator.Description>
        <div className="text-muted-foreground flex flex-col items-center gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Kbd>
              <Upload className="h-3 w-3 shrink-0" />
            </Kbd>
            <span>Upload button in the toolbar</span>
          </div>
          <div className="flex items-center gap-2">
            <Kbd>
              <MousePointer2 className="h-3 w-3 shrink-0" />
            </Kbd>
            <span>Drag and drop anywhere</span>
          </div>
          <div className="flex items-center gap-2">
            <Kbd>ctrl + v</Kbd>
            <span>Paste from clipboard</span>
          </div>
        </div>
      </EmptyIndicator.Content>
    </EmptyIndicator>
  )
}
