import {
  LayoutDashboard,
  FileText,
  Palette,
  Layers,
  Target,
  Map,
  Sparkles,
  Monitor,
  Database,
  Rocket,
  Brain,
  SwatchBook,
  type LucideIcon,
} from 'lucide-react'

// `key` is the URL section segment; the full path is built per active workspace/project via
// useWorkspace().to(key, scope). `scope` decides /{key} (global) vs /{ws}/{key} (workspace) vs
// /{ws}/{project}/{key} (project).
export interface NavItem {
  key: string
  labelKey: string
  icon: LucideIcon
  scope: 'project' | 'workspace' | 'global'
}

export interface NavGroup {
  titleKey: string
  items: NavItem[]
}

// System overview: global, not tied to any workspace (admin-only — gated via can(viewSystem)).
export const RESUMEN: NavItem = { key: 'overview', labelKey: 'nav.overview', icon: LayoutDashboard, scope: 'global' }
// Style library: GLOBAL house-styles (studio taste corpus), GOD/admin only (can manageStyleLibrary).
export const STYLE_LIBRARY: NavItem = { key: 'styles', labelKey: 'nav.styleLibrary', icon: SwatchBook, scope: 'global' }
export const PIPELINE: NavGroup[] = [
  {
    // Workspace-level AI config — its own group, above the project sections.
    titleKey: 'nav.group.intelligence',
    items: [{ key: 'models', labelKey: 'nav.connectionsModels', icon: Brain, scope: 'workspace' }],
  },
  {
    titleKey: 'nav.group.design',
    items: [
      { key: 'brief', labelKey: 'nav.brief', icon: FileText, scope: 'project' },
      { key: 'branding', labelKey: 'nav.branding', icon: Palette, scope: 'project' },
      { key: 'system', labelKey: 'nav.designSystem', icon: Layers, scope: 'project' },
      { key: 'users', labelKey: 'nav.users', icon: Target, scope: 'project' },
      { key: 'architecture', labelKey: 'nav.architecture', icon: Map, scope: 'project' },
      { key: 'style', labelKey: 'nav.designStyle', icon: Sparkles, scope: 'project' },
    ],
  },
  {
    titleKey: 'nav.group.delivery',
    items: [
      { key: 'visualizer', labelKey: 'nav.visualizer', icon: Monitor, scope: 'project' },
      { key: 'cms', labelKey: 'nav.cms', icon: Database, scope: 'project' },
      { key: 'publish', labelKey: 'nav.publish', icon: Rocket, scope: 'project' },
    ],
  },
]

// section segment → label key (breadcrumb). Overview's breadcrumb reads the fuller page title.
export const SECTION_LABEL: Record<string, string> = {
  overview: 'overview.title',
  models: 'nav.connectionsModels',
  styles: 'nav.styleLibrary',
  project: 'nav.project',
  brief: 'nav.brief',
  branding: 'nav.branding',
  system: 'nav.designSystem',
  users: 'nav.users',
  architecture: 'nav.architecture',
  style: 'nav.designStyle',
  visualizer: 'nav.visualizer',
  cms: 'nav.cms',
  publish: 'nav.publish',
}

// sections that live under the workspace (no project segment in the URL)
export const WS_SECTIONS = new Set(['models', 'project'])
