import {
  FileText,
  Palette,
  Layers,
  Target,
  Map as MapIcon,
  Sparkles,
  Monitor,
  Database,
  Rocket,
  type LucideIcon,
} from 'lucide-react'

// Two kinds of assignable "engine":
//  - model: a raw LLM from a provider (DMXAiStudio picks the model)
//  - agent: a pre-configured worker from an agent platform (the agent decides its own model,
//    tools and steps externally; DMXAiStudio only routes the task)
export type EngineKind = 'model' | 'agent'

export interface Engine {
  id: string
  label: string
  kind: EngineKind
  connectionId: string
}

export interface Connection {
  id: string
  name: string
  kind: 'provider' | 'agent-platform'
  engines: Engine[]
}

export const CONNECTIONS: Connection[] = [
  {
    id: 'hermes',
    name: 'Hermes Agent',
    kind: 'agent-platform',
    engines: [
      { id: 'account-specialist', label: 'Account Specialist', kind: 'agent', connectionId: 'hermes' },
      { id: 'brand-specialist', label: 'Brand Specialist', kind: 'agent', connectionId: 'hermes' },
      { id: 'ds-manager', label: 'Design System Manager', kind: 'agent', connectionId: 'hermes' },
      { id: 'ux-specialist', label: 'UX Specialist', kind: 'agent', connectionId: 'hermes' },
      { id: 'ui-rockstar', label: 'UI Rockstar', kind: 'agent', connectionId: 'hermes' },
      { id: 'frontend-artist', label: 'Front End Artist', kind: 'agent', connectionId: 'hermes' },
      { id: 'dev-ninja', label: 'Dev Ninja', kind: 'agent', connectionId: 'hermes' },
    ],
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    kind: 'agent-platform',
    engines: [
      { id: 'claw-pro', label: 'Claw Pro', kind: 'agent', connectionId: 'openclaw' },
      { id: 'claw-max', label: 'Claw Max', kind: 'agent', connectionId: 'openclaw' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic · Claude',
    kind: 'provider',
    engines: [
      { id: 'opus', label: 'Claude Opus', kind: 'model', connectionId: 'anthropic' },
      { id: 'sonnet', label: 'Claude Sonnet', kind: 'model', connectionId: 'anthropic' },
      { id: 'haiku', label: 'Claude Haiku', kind: 'model', connectionId: 'anthropic' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'provider',
    engines: [
      { id: 'gpt-4o', label: 'GPT-4o', kind: 'model', connectionId: 'openai' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', kind: 'model', connectionId: 'openai' },
    ],
  },
]

export const ALL_ENGINES: Engine[] = CONNECTIONS.flatMap((c) => c.engines)
export const getEngine = (id: string): Engine | undefined => ALL_ENGINES.find((e) => e.id === id)
export const getConnection = (id: string): Connection | undefined => CONNECTIONS.find((c) => c.id === id)

export interface Phase {
  key: string
  labelKey: string
  icon: LucideIcon
}

// The 9 pipeline phases — the unit a model/agent is assigned to.
export const PHASES: Phase[] = [
  { key: 'brief', labelKey: 'nav.brief', icon: FileText },
  { key: 'branding', labelKey: 'nav.branding', icon: Palette },
  { key: 'designSystem', labelKey: 'nav.designSystem', icon: Layers },
  { key: 'users', labelKey: 'nav.users', icon: Target },
  { key: 'architecture', labelKey: 'nav.architecture', icon: MapIcon },
  { key: 'designStyle', labelKey: 'nav.designStyle', icon: Sparkles },
  { key: 'visualizer', labelKey: 'nav.visualizer', icon: Monitor },
  { key: 'cms', labelKey: 'nav.cms', icon: Database },
  { key: 'publish', labelKey: 'nav.publish', icon: Rocket },
]

// Default per-phase agent assignment for a configured workspace (Hermes specialists by craft).
export const DEFAULT_PHASE_ENGINES: Record<string, string> = {
  brief: 'account-specialist',
  branding: 'brand-specialist',
  designSystem: 'ds-manager',
  users: 'ux-specialist',
  architecture: 'ux-specialist',
  designStyle: 'ui-rockstar',
  visualizer: 'frontend-artist',
  cms: 'dev-ninja',
  publish: 'dev-ninja',
}

// Only the two seeded demo clients arrive pre-configured (Hermes active); any newly-created
// client starts with no connection and no engine → "Motor no configurado".
const SEED_CLIENTS = ['1', '2']
export const seedConnections = (workspaceId: string): string[] =>
  SEED_CLIENTS.includes(workspaceId) ? ['hermes', 'openclaw', 'anthropic'] : []
export const seedDefaultEngine = (workspaceId: string): string =>
  SEED_CLIENTS.includes(workspaceId) ? 'account-specialist' : ''
export const seedPhaseEngines = (workspaceId: string): Record<string, string> =>
  SEED_CLIENTS.includes(workspaceId) ? { ...DEFAULT_PHASE_ENGINES } : {}

export const effectiveEngineId = (
  phaseKey: string,
  phaseEngines: Record<string, string>,
  defaultEngineId: string,
): string => phaseEngines[phaseKey] ?? defaultEngineId
