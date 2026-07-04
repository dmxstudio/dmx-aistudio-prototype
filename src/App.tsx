import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './screens/Login'
import { Overview } from './screens/Overview'
import { Workspaces } from './screens/Workspaces'
import { Project } from './screens/Project'
import { Brief } from './screens/Brief'
import { Branding } from './screens/Branding'
import { DesignSystem } from './screens/DesignSystem'
import { Architecture } from './screens/Architecture'
import { DesignStyle } from './screens/DesignStyle'
import { Visualizer } from './screens/Visualizer'
import { Cms } from './screens/Cms'
import { Publish } from './screens/Publish'
import { Users } from './screens/Users'
import { Models } from './screens/Models'
import { StyleLibrary } from './screens/StyleLibrary'
import { AccountsAdmin } from './screens/AccountsAdmin'
import { useAuth } from './lib/auth'
import { can } from './lib/permissions'

// Default landing: the system overview (admin-only; non-admins bounce to the workspace picker).
const HOME = '/overview'

// The overview is system-wide and belongs to the system admin — not to any workspace.
function SystemOverview() {
  const { user } = useAuth()
  return can(user.role, 'viewSystem') ? <Overview /> : <Navigate to="/workspaces" replace />
}

// The style library is a GLOBAL studio asset (house-styles / taste corpus) — GOD/admin only.
function StudioStyleLibrary() {
  const { user } = useAuth()
  return can(user.role, 'manageStyleLibrary') ? <StyleLibrary /> : <Navigate to="/workspaces" replace />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppLayout />}>
        {/* global, not workspace scoped */}
        <Route index element={<Navigate to={HOME} replace />} />
        <Route path="/overview" element={<SystemOverview />} />
        <Route path="/styles" element={<StudioStyleLibrary />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="/admin/users" element={<AccountsAdmin />} />
        {/* workspace-scoped */}
        <Route path="/:workspace/models" element={<Models />} />
        <Route path="/:workspace/project" element={<Project />} />
        {/* project-scoped */}
        <Route path="/:workspace/:project/brief" element={<Brief />} />
        <Route path="/:workspace/:project/branding" element={<Branding />} />
        <Route path="/:workspace/:project/system" element={<DesignSystem />} />
        <Route path="/:workspace/:project/users" element={<Users />} />
        <Route path="/:workspace/:project/architecture" element={<Architecture />} />
        <Route path="/:workspace/:project/style" element={<DesignStyle />} />
        <Route path="/:workspace/:project/visualizer" element={<Visualizer />} />
        <Route path="/:workspace/:project/cms" element={<Cms />} />
        <Route path="/:workspace/:project/publish" element={<Publish />} />
        <Route path="*" element={<Navigate to={HOME} replace />} />
      </Route>
    </Routes>
  )
}
