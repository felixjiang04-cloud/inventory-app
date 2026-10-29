import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { api, ApiError, setUnauthorizedHandler, toApiError } from '../api'
import { AuthContext } from '../auth'
import type { CurrentUser } from '../auth'

// Asks the server "who am I?" once at startup, and forgets the user as
// soon as any request comes back 401 (session expired or ended).
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    api
      .get<CurrentUser>('/api/auth/me')
      .then(setUser)
      .catch((e) => {
        const apiError = toApiError(e)
        // 401 = simply not logged in (already handled above); anything
        // else means we couldn't even ask, which the user must see
        if (apiError.code !== 'authError.notLoggedIn') setError(apiError)
      })
    return () => setUnauthorizedHandler(() => {})
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setUser(await api.post<CurrentUser>('/api/auth/login', { email, password }))
    setError(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout', {})
    } finally {
      setUser(null) // even if the server is unreachable, leave this screen
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
