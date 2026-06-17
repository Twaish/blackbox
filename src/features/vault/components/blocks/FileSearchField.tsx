import { useState, useRef, useEffect } from 'react'
import { useVaultFilesStore } from '../../stores/useVaultFilesStore'
import { SearchField } from '../ui/SearchField'
import { useVaultStore } from '../../stores/useVaultStore'
import { useHasVaultSession } from '../../hooks/useHasVaultSession'
import { cn } from '@/utils/tailwind'

export function FileSearchField() {
  const vaultId = useVaultStore((s) => s.selectedVaultId)
  const { hasSession } = useHasVaultSession(vaultId)

  if (!hasSession) return

  return <FileSearchFieldContent />
}

function FileSearchFieldContent() {
  const query = useVaultFilesStore((s) => s.searchQuery)
  const setQuery = useVaultFilesStore((s) => s.setSearchQuery)

  const [localQuery, setLocalQuery] = useState(query)
  const [expanded, setExpanded] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        setExpanded(true)

        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <SearchField
      className={cn(
        `no-drag h-full px-1 transition-all duration-200`,
        expanded
          ? 'w-48'
          : 'hover:bg-secondary/50 w-6 cursor-pointer justify-center',
      )}
      onClick={() => {
        setExpanded(true)

        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      }}
    >
      <SearchField.Icon className="min-h-3.5 min-w-3.5" />
      {expanded && (
        <SearchField.Input
          ref={inputRef}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setQuery(localQuery)
            if (e.key === 'Escape') {
              if (!localQuery) {
                setExpanded(false)
              } else {
                inputRef.current?.blur()
              }
            }
          }}
          onBlur={() => {
            if (!localQuery) {
              setExpanded(false)
            }
          }}
          placeholder="Search..."
          className="no-drag h-full border-none text-xs outline-0"
        />
      )}
    </SearchField>
  )
}
