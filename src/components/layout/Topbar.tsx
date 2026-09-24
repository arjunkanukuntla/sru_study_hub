import { useNavigate } from 'react-router-dom'
import { Search, GraduationCap, Menu } from 'lucide-react'
import { useState, useRef } from 'react'
import { debounce } from '@/lib/fileUtils'

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = debounce((...args: unknown[]) => {
    const q = args[0] as string
    if (q.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`)
    }
  }, 350)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    handleSearch(val)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="layout-topbar">
      {/* Mobile: hamburger + logo */}
      <button
        className="btn btn-ghost btn-icon hide-desktop"
        onClick={onMenuClick}
        aria-label="Open menu"
        style={{ flexShrink: 0 }}
      >
        <Menu size={20} />
      </button>

      <div className="hide-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28,
          background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <GraduationCap size={15} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary-800)' }}>SRU Study</span>
      </div>

      {/* Search bar */}
      <div className="search-bar" style={{ flex: 1 }}>
        <Search size={15} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
        <input
          type="search"
          placeholder="Search subjects, papers, topics…"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Search"
          id="topbar-search"
        />
      </div>

    </header>
  )
}
