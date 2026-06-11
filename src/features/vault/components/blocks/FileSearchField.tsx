import { Kbd } from '@/components/Kbd'
import { useState, useRef, useEffect } from 'react'
import { useVaultFilesStore } from '../../stores/useVaultFilesStore'
import { SearchField } from '../ui/SearchField'
import { useVaultStore } from '../../stores/useVaultStore'
import { useQuery } from '@tanstack/react-query'
import { hasSessionQueryOptions } from '../../queries'

export function FileSearchField() {
  const vaultId = useVaultStore((s) => s.selectedVaultId)
  const { data: hasSession } = useQuery({
    ...hasSessionQueryOptions(vaultId!),
    enabled: !!vaultId,
  })

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

  if (!hasSession) return

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
