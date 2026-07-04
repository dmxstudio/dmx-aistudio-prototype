export type CountryCode = '+52' | '+1'

export interface Client {
  id: string
  name: string
  email?: string
  countryCode: CountryCode
  phone: string // mobile, digits only
  projects: number
}

export const clients: Client[] = [
  { id: '1', name: 'Nimbus Coffee', email: 'hola@nimbus.coffee', countryCode: '+52', phone: '5524567890', projects: 2 },
  { id: '2', name: 'Vela Studio', email: 'team@vela.studio', countryCode: '+1', phone: '4155550172', projects: 1 },
  { id: '3', name: 'Meridian', email: 'hello@meridian.design', countryCode: '+1', phone: '4155550190', projects: 1 },
]

export const COUNTRIES: { code: CountryCode; labelKey: string }[] = [
  { code: '+52', labelKey: 'workspaces.countryMX' },
  { code: '+1', labelKey: 'workspaces.countryUS' },
]

// Studio member accounts (the "users" the admin panel manages). Dahir is the owner/admin ("god").
export type UserRole = 'admin' | 'editor' | 'viewer'
export type UserStatus = 'active' | 'invited' | 'suspended'

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

export const CURRENT_USER_ID = 'u1'

export const accountUsers: AppUser[] = [
  { id: 'u1', name: 'Dahir Mora', email: 'dahir@designo.mx', role: 'admin', status: 'active' },
  { id: 'u2', name: 'Valeria Ríos', email: 'valeria@designo.mx', role: 'editor', status: 'active' },
  { id: 'u3', name: 'Marco Téllez', email: 'marco@designo.mx', role: 'editor', status: 'active' },
  { id: 'u4', name: 'Sofía Lara', email: 'sofia@designo.mx', role: 'viewer', status: 'invited' },
  { id: 'u5', name: 'Bruno Caro', email: 'bruno@designo.mx', role: 'viewer', status: 'suspended' },
]

export interface Agent {
  name: string
  role: string
  rating: number
}

// Los agentes de Hermes por craft (la plataforma de agentes del estudio). Mock — el "desempeño" es ilustrativo.
export const studioAgents: Agent[] = [
  { name: 'UI Rockstar', role: 'Estilo de diseño', rating: 4.9 },
  { name: 'Front End Artist', role: 'Visualizador', rating: 4.9 },
  { name: 'UX Specialist', role: 'Usuarios · Arquitectura', rating: 4.8 },
  { name: 'Brand Specialist', role: 'Branding', rating: 4.8 },
  { name: 'DS Manager', role: 'Design System', rating: 4.7 },
]

export interface MetricCard {
  key: 'projects' | 'approved' | 'builds' | 'coverage'
  value: string
  delta: string
  tone: 'success' | 'danger'
  progress: number
}

export const metrics: MetricCard[] = [
  { key: 'projects', value: '12', delta: '+3', tone: 'success', progress: 70 },
  { key: 'approved', value: '48', delta: '+9%', tone: 'success', progress: 82 },
  { key: 'builds', value: '7', delta: '+2', tone: 'success', progress: 58 },
  { key: 'coverage', value: '86%', delta: '-1.2%', tone: 'danger', progress: 86 },
]

// normalized 0..1 heights for the trend mini-chart
export const trend: number[] = [
  0.55, 0.48, 0.42, 0.38, 0.4, 0.46, 0.52, 0.5, 0.44, 0.4, 0.43, 0.5, 0.58, 0.62,
  0.6, 0.54, 0.5, 0.52, 0.58, 0.66, 0.72, 0.78, 0.74, 0.7, 0.68, 0.72, 0.8, 0.86,
  0.9, 0.88,
]

export interface Project {
  id: string
  workspaceId: string
  name: string
  type: 'website' | 'app'
}

export const projects: Project[] = [
  { id: 'p1', workspaceId: '1', name: 'Sitio web', type: 'website' },
  { id: 'p2', workspaceId: '1', name: 'App de pedidos', type: 'app' },
  { id: 'p3', workspaceId: '2', name: 'Sitio web', type: 'website' },
  { id: 'p4', workspaceId: '3', name: 'Sitio web', type: 'website' },
]
