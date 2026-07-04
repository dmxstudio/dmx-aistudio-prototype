import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clients as seedClients, projects as seedProjects, type Client, type Project } from '../data/mock'
import { slugify } from './slug'
import { readJSON, writeJSON } from './persist'
import { setPersistentValue } from './store'

// URL is the source of truth: /{workspace}/{project}/{section} (project sections) and
// /{workspace}/{section} (workspace sections). Active workspace/project are derived from the path,
// so URLs are shareable + reloadable. Workspace-scoped sections (no project in the URL):
const WS_SECTIONS = new Set(['models', 'project'])
// First path segments that are NOT workspace-scoped (global pages — overview + styles are system-wide):
const GLOBAL_SEG = new Set(['', 'login', 'admin', 'workspaces', 'overview', 'styles'])

const FIRST_SECTION = 'brief' // a context switch lands on the first project section

type ClientDraft = Omit<Client, 'id' | 'projects'>

interface WorkspaceContextValue {
  workspaces: Client[]
  activeWorkspace?: Client
  activeProject?: Project
  workspaceProjects: Project[]
  selectWorkspace: (id: string) => void
  selectProject: (id: string) => void
  createProject: (type: 'website' | 'app', brandSource?: string) => string
  addWorkspace: (data: ClientDraft) => string
  updateWorkspace: (id: string, data: Partial<Client>) => void
  removeWorkspace: (id: string) => void
  projectCountFor: (wsId: string) => number
  // build a path for the active context: to('branding') → /{ws}/{project}/branding,
  // to('models','workspace') → /{ws}/models, to('overview','global') → /overview
  to: (section: string, scope?: 'project' | 'workspace' | 'global') => string
  wsSlug: string
  projectSlug: string
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Clients + projects are the single durable source of truth (shared by the provider and the
  // Workspaces screen) so creating/editing them is fully wired and survives a reload.
  const [clientList, setClientList] = useState<Client[]>(() => {
    const stored = readJSON<Client[]>('clients', seedClients)
    return stored.length ? stored : seedClients // never run with zero workspaces (activeWorkspace must exist)
  })
  const [projectList, setProjectList] = useState<Project[]>(() => readJSON('projects', seedProjects))

  useEffect(() => writeJSON('clients', clientList), [clientList])
  useEffect(() => writeJSON('projects', projectList), [projectList])

  const segs = pathname.split('/').filter(Boolean)
  const wsSeg = GLOBAL_SEG.has(segs[0] ?? '') ? undefined : segs[0]
  const activeWorkspace = clientList.find((c) => slugify(c.name) === wsSeg) ?? clientList[0]

  const workspaceProjects = useMemo(
    () => projectList.filter((p) => p.workspaceId === activeWorkspace.id),
    [projectList, activeWorkspace.id],
  )
  // segs[1] is a project slug only when it's not a workspace-level section.
  const projSeg = segs[1] && !WS_SECTIONS.has(segs[1]) ? segs[1] : undefined
  const activeProject = workspaceProjects.find((p) => slugify(p.name) === projSeg) ?? workspaceProjects[0]

  const wsSlug = slugify(activeWorkspace.name)
  const projectSlug = activeProject ? slugify(activeProject.name) : ''
  const to = (section: string, scope: 'project' | 'workspace' | 'global' = 'project') =>
    scope === 'global'
      ? `/${section}`
      : scope === 'workspace'
        ? `/${wsSlug}/${section}`
        : `/${wsSlug}/${projectSlug}/${section}`

  const selectWorkspace = (id: string) => {
    const w = clientList.find((c) => c.id === id)
    if (!w) return
    const ws = slugify(w.name)
    const first = projectList.find((p) => p.workspaceId === id)
    // Empty workspace → land on the new-project screen (overview is no longer workspace-scoped).
    navigate(first ? `/${ws}/${slugify(first.name)}/${FIRST_SECTION}` : `/${ws}/project`)
  }
  const selectProject = (id: string) => {
    const p = projectList.find((pp) => pp.id === id)
    if (p) navigate(`/${wsSlug}/${slugify(p.name)}/${FIRST_SECTION}`)
  }

  const createProject = (type: 'website' | 'app', brandSource?: string) => {
    const id = crypto.randomUUID()
    const name = type === 'website' ? 'Sitio web' : 'Aplicación'
    setProjectList((prev) => [...prev, { id, workspaceId: activeWorkspace.id, name, type }])
    if (brandSource && brandSource !== 'own') setPersistentValue('brandSource', id, brandSource)
    navigate(`/${wsSlug}/${slugify(name)}/${FIRST_SECTION}`)
    return id
  }

  const addWorkspace = (data: ClientDraft) => {
    const id = crypto.randomUUID()
    setClientList((prev) => [{ id, projects: 0, ...data }, ...prev])
    return id
  }
  const updateWorkspace = (id: string, data: Partial<Client>) =>
    setClientList((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  const removeWorkspace = (id: string) => {
    if (clientList.length <= 1) return // keep ≥1 workspace so there's always a valid active context
    setClientList((prev) => prev.filter((c) => c.id !== id))
    setProjectList((prev) => prev.filter((p) => p.workspaceId !== id)) // cascade: drop its projects
  }
  // Live project count per workspace, derived from projectList (single source of truth — the
  // Client.projects seed field is stale once projects are created/deleted at runtime).
  const projectCountFor = (wsId: string) => projectList.filter((p) => p.workspaceId === wsId).length

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces: clientList,
        activeWorkspace,
        activeProject,
        workspaceProjects,
        selectWorkspace,
        selectProject,
        createProject,
        addWorkspace,
        updateWorkspace,
        removeWorkspace,
        projectCountFor,
        to,
        wsSlug,
        projectSlug,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
