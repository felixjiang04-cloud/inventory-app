import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { api, ApiError, toApiError } from '../api'
import { useAuth } from '../auth'
import ErrorMessage from '../components/ErrorMessage'

const MIN_PASSWORD_LENGTH = 8 // same rule as the server (auth.py)

interface UserRow {
  id: number
  email: string
  role: 'owner' | 'staff'
  active: boolean
}

// Owner-only: add staff accounts, deactivate them, reset their passwords.
export default function Staff() {
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const [users, setUsers] = useState<UserRow[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [done, setDone] = useState<string | null>(null) // i18n key of a success note
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetFor, setResetFor] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const reload = useCallback(() => {
    api
      .get<UserRow[]>('/api/users')
      .then(setUsers)
      .catch((e) => setError(toApiError(e)))
  }, [])

  useEffect(() => reload(), [reload])

  // Runs one change, then shows its error or its success note.
  async function attempt(change: () => Promise<unknown>, successKey: string) {
    setError(null)
    setDone(null)
    try {
      await change()
      setDone(successKey)
      reload()
      return true
    } catch (e) {
      setError(toApiError(e))
      return false
    }
  }

  async function addStaff(event: React.FormEvent) {
    event.preventDefault()
    const added = await attempt(
      () => api.post('/api/users', { email, password }),
      'staff.added',
    )
    if (added) {
      setEmail('')
      setPassword('')
    }
  }

  async function resetPassword(event: React.FormEvent, userId: number) {
    event.preventDefault()
    const changed = await attempt(
      () => api.put(`/api/users/${userId}/password`, { password: newPassword }),
      'staff.passwordReset',
    )
    if (changed) setResetFor(null)
  }

  return (
    <section>
      <h1>{t('staff.title')}</h1>
      <ErrorMessage error={error} />
      {done && <p className="success-box">{t(done)}</p>}

      {users === null && !error && <p>{t('common.loading')}</p>}
      <ul className="staff-list">
        {users?.map((u) => (
          <li key={u.id}>
            <span>
              <strong>{u.email}</strong> · {t(`role.${u.role}`)}{' '}
              {!u.active && <span className="badge pending">{t('staff.inactive')}</span>}
            </span>
            {u.id !== me?.id && (
              <span className="row">
                <button
                  type="button"
                  onClick={() =>
                    attempt(
                      () => api.put(`/api/users/${u.id}/active`, { active: !u.active }),
                      u.active ? 'staff.deactivated' : 'staff.reactivated',
                    )
                  }
                >
                  {u.active ? t('staff.deactivate') : t('staff.reactivate')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetFor(u.id)
                    setNewPassword('')
                  }}
                >
                  {t('staff.resetPassword')}
                </button>
              </span>
            )}
            {resetFor === u.id && (
              <form className="row" onSubmit={(e) => resetPassword(e, u.id)}>
                <input
                  type="password"
                  autoComplete="new-password"
                  aria-label={t('staff.newPassword')}
                  placeholder={t('staff.newPassword')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="submit">{t('staff.save')}</button>
                <button type="button" onClick={() => setResetFor(null)}>
                  {t('common.cancel')}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <h2>{t('staff.addTitle')}</h2>
      <form onSubmit={addStaff}>
        <label>
          {t('login.email')}
          <input
            type="email"
            autoComplete="off"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          {t('staff.initialPassword')}
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <p className="muted">{t('staff.passwordHint', { min: MIN_PASSWORD_LENGTH })}</p>
        <button type="submit">{t('staff.add')}</button>
      </form>
    </section>
  )
}
