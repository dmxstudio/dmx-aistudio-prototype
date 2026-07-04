import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Check, Plus, Search, Folder, List } from 'lucide-react'
import { Popover } from '../ui/Popover'
import { useWorkspace } from '../../lib/workspace'

const menuItem = 'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-raised text-left'

export function WorkspaceSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaces, activeWorkspace, selectWorkspace } = useWorkspace()
  const initial = activeWorkspace?.name?.[0]?.toUpperCase() ?? '·'
  const hide = collapsed ? 'md:hidden' : ''

  return (
    <Popover
      menuClassName="w-[228px]"
      button={
        <div className={`flex items-center gap-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors px-2 ${collapsed ? 'md:px-0 md:justify-center' : ''}`}>
          <span className="w-6 h-6 rounded-md bg-accent text-accent-ink text-[11px] font-semibold flex items-center justify-center shrink-0">
            {initial}
          </span>
          <span className={`flex-1 text-left text-sm text-white font-medium truncate ${hide}`}>
            {activeWorkspace?.name ?? '—'}
          </span>
          <ChevronDown size={14} className={`text-[var(--sidebar-faint)] shrink-0 ${hide}`} />
        </div>
      }
    >
      {(close) => (
        <div className="bg-surface border border-line rounded-xl shadow-soft p-1.5">
          <div className="flex items-center gap-2 px-2.5 py-2 mb-1 rounded-lg bg-raised">
            <Search size={14} className="text-faint" />
            <span className="text-xs text-faint">{t('nav.searchWorkspace')}</span>
          </div>
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                selectWorkspace(w.id)
                close()
              }}
              className={menuItem}
            >
              <span className="w-5 h-5 rounded-md bg-raised text-muted text-[11px] font-semibold flex items-center justify-center shrink-0">
                {w.name[0].toUpperCase()}
              </span>
              <span className="flex-1 text-[13px] text-content truncate">{w.name}</span>
              {w.id === activeWorkspace?.id && <Check size={14} className="text-accent shrink-0" />}
            </button>
          ))}
          <div className="border-t border-line mt-1 pt-1">
            <button onClick={() => { navigate('/workspaces'); close() }} className={`${menuItem} text-[13px] text-muted`}>
              <List size={15} />
              {t('nav.allWorkspaces')}
            </button>
            <button onClick={() => { navigate('/workspaces'); close() }} className={`${menuItem} text-[13px] text-accent-strong`}>
              <Plus size={15} />
              {t('nav.newWorkspace')}
            </button>
          </div>
        </div>
      )}
    </Popover>
  )
}

export function ProjectSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workspaceProjects, activeProject, selectProject, to } = useWorkspace()
  const hide = collapsed ? 'md:hidden' : ''

  return (
    <Popover
      menuClassName="w-[228px]"
      button={
        <div className={`flex items-center gap-2 h-9 rounded-lg hover:bg-white/5 transition-colors pl-3 pr-2 ${collapsed ? 'md:px-0 md:justify-center' : ''}`}>
          <Folder size={14} className="text-[var(--sidebar-faint)] shrink-0" />
          <span className={`flex-1 text-left text-[13px] text-[var(--sidebar-text)] truncate ${hide}`}>
            {activeProject?.name ?? t('nav.noProject')}
          </span>
          <ChevronDown size={13} className={`text-[var(--sidebar-faint)] shrink-0 ${hide}`} />
        </div>
      }
    >
      {(close) => (
        <div className="bg-surface border border-line rounded-xl shadow-soft p-1.5">
          {workspaceProjects.length === 0 && (
            <p className="px-2 py-2 text-[13px] text-muted">{t('nav.noProject')}</p>
          )}
          {workspaceProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                selectProject(p.id)
                close()
              }}
              className={menuItem}
            >
              <Folder size={15} className="text-muted shrink-0" />
              <span className="flex-1 text-[13px] text-content truncate">{p.name}</span>
              {p.id === activeProject?.id && <Check size={14} className="text-accent shrink-0" />}
            </button>
          ))}
          <div className="border-t border-line mt-1 pt-1">
            <button onClick={() => { navigate(to('project', 'workspace')); close() }} className={`${menuItem} text-[13px] text-accent-strong`}>
              <Plus size={15} />
              {t('nav.newProject')}
            </button>
          </div>
        </div>
      )}
    </Popover>
  )
}
