import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { RESUMEN, STYLE_LIBRARY, PIPELINE } from '../../config/nav'
import { useWorkspace } from '../../lib/workspace'
import { useAuth } from '../../lib/auth'
import { can } from '../../lib/permissions'
import { WorkspaceSwitcher, ProjectSwitcher } from './ContextSwitchers'

// Compact = icon-only, driven by `collapsed` from md up (tablet + desktop share the toggle).
// The drawer (below md) always renders full — off-canvas content sits below md where these md:*
// hide-rules don't apply, so `collapsed` never hides text in the drawer.
const labelCls = (collapsed: boolean) => (collapsed ? 'md:hidden' : '')

const itemCls = (collapsed: boolean) => ({ isActive }: { isActive: boolean }) =>
  `flex items-center h-10 rounded-full text-sm transition-colors gap-3 px-3 ${
    collapsed ? 'md:gap-0 md:px-0 md:justify-center' : ''
  } ${isActive ? 'bg-accent text-accent-ink font-medium' : 'text-[var(--sidebar-text)] hover:bg-white/5'}`

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const { t } = useTranslation()
  const { to } = useWorkspace()
  const { user } = useAuth()
  const ResumenIcon = RESUMEN.icon
  const StyleLibIcon = STYLE_LIBRARY.icon
  const item = itemCls(collapsed)
  const label = labelCls(collapsed)

  return (
    <aside
      className={`bg-sidebar flex flex-col h-full shrink-0 z-40 transition-[width,transform] duration-200
        fixed inset-y-0 left-0 md:static md:z-auto md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 ${collapsed ? 'md:w-16' : 'md:w-64'}`}
    >
      <div className={`h-16 flex items-center gap-2.5 shrink-0 px-5 ${collapsed ? 'md:px-0 md:justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-ink shrink-0">
          <Sparkles size={18} />
        </div>
        <span className={`font-display text-lg font-bold text-white ${label}`}>{t('app.name')}</span>
      </div>

      {/* Global admin sections — not part of any workspace (GOD/admin only). */}
      {can(user.role, 'viewSystem') && (
        <div className="px-3 pb-2 shrink-0 space-y-1">
          <NavLink to={to(RESUMEN.key, RESUMEN.scope)} className={item} title={t(RESUMEN.labelKey)} onClick={onMobileClose}>
            <ResumenIcon size={18} className="shrink-0" />
            <span className={label}>{t(RESUMEN.labelKey)}</span>
          </NavLink>
          {can(user.role, 'manageStyleLibrary') && (
            <NavLink to={to(STYLE_LIBRARY.key, STYLE_LIBRARY.scope)} className={item} title={t(STYLE_LIBRARY.labelKey)} onClick={onMobileClose}>
              <StyleLibIcon size={18} className="shrink-0" />
              <span className={label}>{t(STYLE_LIBRARY.labelKey)}</span>
            </NavLink>
          )}
        </div>
      )}

      <div className="px-3 pb-3 mb-1 border-b border-white/10 space-y-1 shrink-0">
        <WorkspaceSwitcher collapsed={collapsed} />
        <ProjectSwitcher collapsed={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-5">
        {PIPELINE.map((group) => (
          <div key={group.titleKey}>
            <p className={`px-3 mb-1.5 text-[11px] tracking-wide text-[var(--sidebar-faint)] ${collapsed ? 'md:hidden' : ''}`}>
              {t(group.titleKey)}
            </p>
            <div className="space-y-0.5">
              {group.items.map((it) => {
                const Icon = it.icon
                return (
                  <NavLink key={it.key} to={to(it.key, it.scope)} className={item} title={t(it.labelKey)} onClick={onMobileClose}>
                    <Icon size={18} className="shrink-0" />
                    <span className={label}>{t(it.labelKey)}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Compact toggle — tablet + desktop (mobile uses the drawer, so hidden below md). */}
      <button
        onClick={onToggle}
        aria-label={t(collapsed ? 'nav.expand' : 'nav.collapse')}
        title={t(collapsed ? 'nav.expand' : 'nav.collapse')}
        className={`hidden md:flex items-center justify-center w-10 h-10 mb-3 mt-1 rounded-full text-[var(--sidebar-faint)] hover:text-white hover:bg-white/5 transition-colors shrink-0 ${
          collapsed ? 'self-center' : 'self-end mr-3'
        }`}
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>
    </aside>
  )
}
