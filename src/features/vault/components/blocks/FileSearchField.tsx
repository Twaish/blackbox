import { Kbd } from '@/components/Kbd'
import { useState, useRef, useEffect } from 'react'
import { useVaultFilesStore } from '../../stores/useVaultFilesStore'
import { SearchField } from '../ui/SearchField'

export function FileSearchField() {
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
    <SearchField className="h-full border-l">
      <SearchField.Icon />
      <SearchField.Input
        ref={inputRef}
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setQuery(localQuery)
        }}
        placeholder="Search..."
        className="no-drag h-full border-none text-xs outline-0"
      />
      <div className="absolute right-0 mx-1 my-auto">
        <Kbd keys={['ctrl', 'f']}></Kbd>
      </div>
    </SearchField>
  )
}
