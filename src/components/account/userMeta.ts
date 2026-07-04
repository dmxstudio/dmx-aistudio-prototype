import type { UserRole, UserStatus } from '../../data/mock'

// Badge tones for user role and account status (shared by the avatar menu and the admin panel).
export const roleTone = (r: UserRole): 'accent' | 'neutral' => (r === 'admin' ? 'accent' : 'neutral')

export const statusTone = (s: UserStatus): 'success' | 'warning' | 'danger' =>
  s === 'active' ? 'success' : s === 'invited' ? 'warning' : 'danger'

export const ROLES: UserRole[] = ['admin', 'editor', 'viewer']
export const STATUSES: UserStatus[] = ['active', 'invited', 'suspended']
