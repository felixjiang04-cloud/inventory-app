// Who is logged in, shared with every page through React context.
// The provider component lives in components/AuthProvider.tsx.

import { createContext, useContext } from 'react'

import type { ApiError } from './api'

export interface CurrentUser {
  id: number
  email: string
  role: 'owner' | 'staff'
}

export interface AuthState {
  // undefined = still asking the server; null = nobody is logged in
  user: CurrentUser | null | undefined
  // the server could not be asked at all (e.g. it is down)
  error: ApiError | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (auth === null) throw new Error('useAuth() needs an <AuthProvider> above it')
  return auth
}

// Staff may enter invoices and look around; confirming lines, posting,
// the catalog and staff accounts are the owner's (the server enforces
// this too — the UI only hides what would be refused anyway).
export function useIsOwner(): boolean {
  return useAuth().user?.role === 'owner'
}
