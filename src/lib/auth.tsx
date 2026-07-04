import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  accountUsers,
  CURRENT_USER_ID,
  type AppUser,
  type UserRole,
  type UserStatus,
} from '../data/mock'
import { readJSON, writeJSON } from './persist'

export interface UserDraft {
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

interface AuthContextValue {
  user: AppUser
  users: AppUser[]
  signIn: (email: string) => void
  signOut: () => void
  updateProfile: (patch: { name: string; email: string }) => void
  addUser: (data: UserDraft) => void
  updateUser: (id: string, data: UserDraft) => void
  removeUser: (id: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Frontend mock: there's no real auth. The narrative is that Dahir (admin / "god") is signed in.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(() => readJSON('users', accountUsers))
  const [currentUserId, setCurrentUserId] = useState<string>(() => readJSON('session', CURRENT_USER_ID))
  const user = users.find((u) => u.id === currentUserId) ?? users[0]

  useEffect(() => writeJSON('users', users), [users])
  useEffect(() => writeJSON('session', currentUserId), [currentUserId])

  const signIn = (email: string) => {
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    setCurrentUserId(found?.id ?? CURRENT_USER_ID)
  }
  const signOut = () => setCurrentUserId(CURRENT_USER_ID)
  const updateProfile = (patch: { name: string; email: string }) =>
    setUsers((prev) => prev.map((u) => (u.id === currentUserId ? { ...u, ...patch } : u)))
  const addUser = (data: UserDraft) =>
    setUsers((prev) => [{ id: crypto.randomUUID(), ...data }, ...prev])
  const updateUser = (id: string, data: UserDraft) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))
  const removeUser = (id: string) => setUsers((prev) => prev.filter((u) => u.id !== id))

  return (
    <AuthContext.Provider
      value={{ user, users, signIn, signOut, updateProfile, addUser, updateUser, removeUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
