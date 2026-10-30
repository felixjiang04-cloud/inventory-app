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
    <div className="page">
      <h1>{t('staff.title')}</h1>
      <ErrorMessage error={error} />
      {done && (
        <div className="notice notice-ok">
          <p>{t(done)}</p>
        </div>
      )}

      {users === null && !error && <p className="muted">{t('common.loading')}</p>}
      {users && (
        <ul className="list">
          {users.map((u) => (
            <li key={u.id}>
              <div className="list-row">
                <span className="list-row-main">
                  <span className="list-row-title">{u.email}</span>
                  <span className="list-row-meta">{t(`role.${u.role}`)}</span>
                </span>
                {!u.active && <span className="badge">{t('staff.inactive')}</span>}
              </div>
              {u.id !== me?.id && (
                <div className="cluster list-row-extra">
                  <button
                    type="button"
                    className={u.active ? 'btn btn-danger' : 'btn'}
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
                    className="btn btn-quiet"
                    onClick={() => {
                      setResetFor(u.id)
                      setNewPassword('')
                    }}
                  >
                    {t('staff.resetPassword')}
                  </button>
                </div>
              )}
              {resetFor === u.id && (
                <form className="list-row-extra" onSubmit={(e) => resetPassword(e, u.id)}>
                  <div className="field">
                    <label htmlFor={`reset-${u.id}`}>{t('staff.newPassword')}</label>
                    <input
                      id={`reset-${u.id}`}
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="cluster">
                    <button type="submit" className="btn btn-primary">
                      {t('staff.save')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => setResetFor(null)}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2>{t('staff.addTitle')}</h2>
      <form onSubmit={addStaff}>
        <div className="field">
          <label htmlFor="staff-email">{t('login.email')}</label>
          <input
            id="staff-email"
            type="email"
            autoComplete="off"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="staff-password">{t('staff.initialPassword')}</label>
          <input
            id="staff-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="field-hint">{t('staff.passwordHint', { min: MIN_PASSWORD_LENGTH })}</p>
        </div>
        <button type="submit" className="btn btn-primary">
          {t('staff.add')}
        </button>
      </form>
    </div>
  )
}
