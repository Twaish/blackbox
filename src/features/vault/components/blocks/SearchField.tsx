import { cn } from '@/utils/tailwind'
import { ComponentProps, useEffect, useRef, useState } from 'react'
import { useVaultFilesStore } from '../../stores/useVaultFilesStore'
import { Search } from 'lucide-react'
import { Kbd } from '@/components/Kbd'

export function SearchField({ className, ...props }: ComponentProps<'input'>) {
  const query = useVaultFilesStore((s) => s.searchQuery)
  const setQuery = useVaultFilesStore((s) => s.setSearchQuery)

  const [localQuery, setLocalQuery] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative flex h-full items-center gap-2 border-l px-2">
      <Search className="text-muted-foreground h-3.5 w-3.5" />
      <input
        ref={inputRef}
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setQuery(localQuery)
        }}
        placeholder="Search..."
        className={cn(
          'no-drag h-full border-none text-xs outline-0',
          className,
        )}
        {...props}
      />
      <div className="absolute right-0 mx-1 my-auto">
        <Kbd keys={['ctrl', 'f']}></Kbd>
      </div>
    </div>
  )
}
