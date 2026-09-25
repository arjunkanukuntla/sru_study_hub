import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, BookOpen, FileText, FlaskConical, Library,
  BarChart3, Brain, Search, Upload, Star, Settings, ShieldCheck,
  GraduationCap, X
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          label: 'Home',      icon: Home },
  { to: '/subjects',  label: 'Subjects',  icon: BookOpen },
  { to: '/papers',    label: 'Papers',    icon: FileText },
  { to: '/labs',      label: 'Labs',      icon: FlaskConical },
  { to: '/resources', label: 'Resources', icon: Library },
  { to: '/study',     label: 'Study',     icon: Brain },
  { to: '/search',    label: 'Search',    icon: Search },
]

const USER_ITEMS = [
  { to: '/my-study',  label: 'My Study',  icon: Star },
  { to: '/upload',    label: 'Upload',    icon: Upload },
  { to: '/about',     label: 'About',     icon: GraduationCap },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="layout-sidebar" style={{ overflowY: 'auto' }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1rem 1rem',
        borderBottom: '1px solid var(--border-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary-800)', lineHeight: 1.1 }}>SRU Study</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1 }}>SR University</div>
          </div>
        </NavLink>
        {onClose && (
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ padding: '0.25rem' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main nav */}
      <div style={{ padding: '0.75rem 0.625rem', flex: 1 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem' }}>
          Explore
        </div>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} className="nav-item-icon" />
            {label}
          </NavLink>
        ))}

        <div style={{ height: '1rem' }} />
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.5rem', marginBottom: '0.375rem' }}>
          My Account
        </div>
        {USER_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} className="nav-item-icon" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Footer info */}
      <div style={{ padding: '0.75rem 0.625rem', borderTop: '1px solid var(--border-base)' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', padding: '0.25rem 0.5rem', lineHeight: 1.6 }}>
          SRU Study Hub v1.0<br />
          <span style={{ color: 'var(--color-primary-500)' }}>SR University Academic Resource</span><br />
          <span style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <a href="/terms"   style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
            <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
          </span>
        </div>
      </div>
    </div>
  )
}
