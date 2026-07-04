import type { UserRole } from '../data/mock'

// MVP capability matrix — decisions/edits gate on the logged-in account's role, not a
// per-section lens (see memory: roles-permissions-mvp). 'comment' is reserved for Stage 2
// (Invitado leaves feedback without editing/approving).
export type Capability =
  | 'edit'
  | 'approve'
  | 'generate'
  | 'advance'
  | 'comment'
  | 'manageAccounts'
  | 'viewSystem' // system-wide overview — belongs to the system admin, not to any workspace
  | 'manageStyleLibrary' // GLOBAL house-styles library (the studio taste corpus) — GOD/admin only

const MATRIX: Record<UserRole, Capability[]> = {
  admin: ['edit', 'approve', 'generate', 'advance', 'comment', 'manageAccounts', 'viewSystem', 'manageStyleLibrary'],
  editor: ['edit', 'approve', 'generate', 'advance', 'comment'],
  viewer: ['comment'],
}

export function can(role: UserRole, capability: Capability): boolean {
  return MATRIX[role].includes(capability)
}
