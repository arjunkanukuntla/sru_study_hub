import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Topbar } from './Topbar'

export function RootLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="layout-root">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
            }}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 'min(80vw, 280px)',
            zIndex: 61,
            animation: 'slide-in-right 0.2s ease',
          }}>
            <Sidebar onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="layout-main">
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="layout-content animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}
