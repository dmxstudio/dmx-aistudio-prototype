import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { readJSON, writeJSON } from '../../lib/persist'

export function AppLayout() {
  // Compact toggle for the ≥md sidebar (persisted). First-load default is breakpoint-aware:
  // collapsed on tablet (<lg), expanded on desktop; once the user toggles, their choice persists.
  const [collapsed, setCollapsed] = useState(() => readJSON('ui:sidebarCollapsed', window.innerWidth < 1024))
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => writeJSON('ui:sidebarCollapsed', collapsed), [collapsed])

  return (
    <div className="h-full flex bg-canvas">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      {/* Drawer backdrop — mobile only. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
