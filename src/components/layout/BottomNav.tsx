import { NavLink } from 'react-router-dom'
import { Home, BookOpen, FileText, Brain, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

const PRIMARY_ITEMS = [
  { to: '/',         label: 'Home',     icon: Home },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/papers',   label: 'Papers',   icon: FileText },
  { to: '/study',    label: 'Study',    icon: Brain },
]

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {/* Overlay for More menu */}
      {moreOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More menu */}
      {moreOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height) + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-base)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          padding: '0.75rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          zIndex: 51,
          minWidth: 260,
          animation: 'scale-in 0.15s ease',
        }}>
          {[
            { to: '/labs',      label: 'Labs',      emoji: '🧪' },
            { to: '/resources', label: 'Resources',  emoji: '📚' },
            { to: '/analytics', label: 'Analytics',  emoji: '📊' },
            { to: '/search',    label: 'Search',     emoji: '🔍' },
            { to: '/my-study',  label: 'My Study',   emoji: '⭐' },
            { to: '/upload',    label: 'Upload',     emoji: '⬆️' },
            { to: '/about',     label: 'About',      emoji: 'ℹ️' },
          ].map(({ to, label, emoji }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMoreOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                textDecoration: 'none',
                transition: 'background var(--transition-fast)',
              }}
              className="more-menu-item"
            >
              <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
              {label}
            </NavLink>
          ))}
        </div>
      )}

      <nav className="mobile-bottom-nav">
        {PRIMARY_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <div className="bottom-nav-icon">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          className={`bottom-nav-item ${moreOpen ? 'active' : ''}`}
          onClick={() => setMoreOpen(!moreOpen)}
          aria-label="More navigation options"
        >
          <div className="bottom-nav-icon">
            <MoreHorizontal size={20} strokeWidth={1.8} />
          </div>
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
