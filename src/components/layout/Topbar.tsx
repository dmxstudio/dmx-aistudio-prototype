import { useState } from 'react'
import { Search, Bell, ChevronRight, ChevronDown, Check, User, Users, LogOut, Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Popover } from '../ui/Popover'
import { ProfileModal } from '../account/ProfileModal'
import { LangToggle } from './LangToggle'
import { ThemeToggle } from './ThemeToggle'
import { roleTone } from '../account/userMeta'
import { useWorkspace } from '../../lib/workspace'
import { useAuth } from '../../lib/auth'
import { can } from '../../lib/permissions'
import { SECTION_LABEL, WS_SECTIONS, PIPELINE } from '../../config/nav'

const PANELS = PIPELINE.flatMap((g) => g.items)
const menuItem =
  'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-raised text-left text-[13px] text-content'

interface CrumbItem {
  key: string
  label: string
  active: boolean
  onSelect: () => void
}

function Crumb({ label, current = false, items }: { label: string; current?: boolean; items: CrumbItem[] }) {
  return (
    <Popover
      menuClassName="w-56"
      button={
        <span
          className={`inline-flex items-center gap-1 px-1.5 h-7 rounded-md hover:bg-raised max-w-[150px] ${
            current ? 'text-content font-medium' : 'text-muted'
          }`}
        >
          <span className="truncate">{label}</span>
          <ChevronDown size={13} className="shrink-0 text-faint" />
        </span>
      }
    >
      {(close) => (
        <div className="bg-surface border border-line rounded-xl shadow-soft p-1.5 max-h-72 overflow-y-auto">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => {
                it.onSelect()
                close()
              }}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-raised text-left"
            >
              <span
                className={`flex-1 truncate text-[13px] ${
                  it.active ? 'text-accent-strong font-medium' : 'text-content'
                }`}
              >
                {it.label}
              </span>
              {it.active && <Check size={14} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { workspaces, activeWorkspace, activeProject, workspaceProjects, selectWorkspace, selectProject, to } =
    useWorkspace()
  const { user, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const segs = pathname.split('/').filter(Boolean)
  const section = segs[segs.length - 1] ?? ''
  const globalLabel: Record<string, string> = { admin: 'accounts.title', workspaces: 'nav.workspaces' }
  const sectionLabel = globalLabel[segs[0]]
    ? t(globalLabel[segs[0]])
    : SECTION_LABEL[section]
      ? t(SECTION_LABEL[section])
      : ''
  const projectScoped = segs.length === 3 // /{ws}/{project}/{section}
  const workspaceScoped = segs.length === 2 && WS_SECTIONS.has(section)

  const workspaceItems: CrumbItem[] = workspaces.map((w) => ({
    key: w.id,
    label: w.name,
    active: w.id === activeWorkspace?.id,
    onSelect: () => selectWorkspace(w.id),
  }))
  const projectItems: CrumbItem[] = workspaceProjects.map((p) => ({
    key: p.id,
    label: p.name,
    active: p.id === activeProject?.id,
    onSelect: () => selectProject(p.id),
  }))
  const panelItems: CrumbItem[] = PANELS.map((p) => ({
    key: p.key,
    label: t(p.labelKey),
    active: p.key === section,
    onSelect: () => navigate(to(p.key, p.scope)),
  }))

  return (
    <>
    <header className="shrink-0 px-4 md:px-8 flex flex-wrap items-center gap-x-3 gap-y-1 py-2 md:py-0 md:h-16 md:flex-nowrap">
      <button
        onClick={onMenu}
        aria-label={t('nav.openMenu')}
        className="md:hidden order-1 w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-muted hover:text-content hover:bg-raised shrink-0"
      >
        <Menu size={20} />
      </button>
      {/* Breadcrumb drops to its own full-width line below md (with horizontal scroll); inline at md+. */}
      <nav
        aria-label="breadcrumb"
        className="order-3 basis-full overflow-x-auto md:order-1 md:basis-auto md:overflow-visible min-w-0 flex items-center gap-0.5 text-sm"
      >
        {projectScoped ? (
          <>
            <Crumb label={activeWorkspace?.name ?? '—'} items={workspaceItems} />
            <ChevronRight size={14} className="text-faint shrink-0" />
            <Crumb label={activeProject?.name ?? t('nav.noProject')} items={projectItems} />
            <ChevronRight size={14} className="text-faint shrink-0" />
            <Crumb label={sectionLabel} current items={panelItems} />
          </>
        ) : workspaceScoped ? (
          <>
            <Crumb label={activeWorkspace?.name ?? '—'} items={workspaceItems} />
            <ChevronRight size={14} className="text-faint shrink-0" />
            <span className="text-content font-medium truncate px-1.5">{sectionLabel}</span>
          </>
        ) : (
          <span className="text-content font-medium truncate px-1.5">{sectionLabel}</span>
        )}
      </nav>

      <div className="order-2 ml-auto flex items-center gap-3">
      <div className="relative hidden md:block w-40 lg:w-56">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          className="w-full h-10 rounded-full bg-surface border border-line pl-10 pr-4 text-sm text-content placeholder:text-faint outline-none focus:border-accent"
          placeholder={t('topbar.searchPlaceholder')}
        />
      </div>
      <button
        aria-label="Notifications"
        className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-muted hover:text-content shrink-0"
      >
        <Bell size={18} />
      </button>
      <LangToggle />
      <ThemeToggle />
      <Popover
        align="end"
        menuClassName="w-60"
        button={<Avatar name={user.name} status />}
      >
        {(close) => (
          <div className="bg-surface border border-line rounded-xl shadow-soft p-1.5">
            <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-2">
              <Avatar name={user.name} size={38} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-content truncate">{user.name}</p>
                <p className="text-[12px] text-muted truncate">{user.email}</p>
              </div>
            </div>
            <div className="px-2 pb-2">
              <Badge tone={roleTone(user.role)}>{t(`account.role.${user.role}`)}</Badge>
            </div>
            <div className="border-t border-line pt-1">
              <button
                onClick={() => {
                  setProfileOpen(true)
                  close()
                }}
                className={menuItem}
              >
                <User size={15} className="text-muted" />
                {t('account.editProfile')}
              </button>
              {can(user.role, 'manageAccounts') && (
                <button
                  onClick={() => {
                    navigate('/admin/users')
                    close()
                  }}
                  className={menuItem}
                >
                  <Users size={15} className="text-muted" />
                  {t('account.accountsAdmin')}
                </button>
              )}
            </div>
            <div className="border-t border-line pt-1 mt-1">
              <button
                onClick={() => {
                  signOut()
                  navigate('/login')
                  close()
                }}
                className={`${menuItem} text-danger-strong`}
              >
                <LogOut size={15} />
                {t('account.signOut')}
              </button>
            </div>
          </div>
        )}
      </Popover>
      </div>
    </header>
    <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
