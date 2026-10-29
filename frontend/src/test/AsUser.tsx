import type { ReactNode } from 'react'
import { vi } from 'vitest'

import { AuthContext } from '../auth'
import type { CurrentUser } from '../auth'

// Renders its children as if this user were logged in — no login request.
export function AsUser({
  role,
  children,
}: {
  role: CurrentUser['role']
  children: ReactNode
}) {
  const user: CurrentUser = { id: 1, email: `${role}@example.test`, role }
  return (
    <AuthContext.Provider value={{ user, error: null, login: vi.fn(), logout: vi.fn() }}>
      {children}
    </AuthContext.Provider>
  )
}
