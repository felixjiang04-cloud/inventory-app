import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError, toApiError } from '../api'
import { useAuth } from '../auth'
import ErrorMessage from '../components/ErrorMessage'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password) // on success the app swaps this page out
    } catch (e) {
      setError(toApiError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page login">
      <h1>{t('login.title')}</h1>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="login-email">{t('login.email')}</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">{t('login.password')}</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <ErrorMessage error={error} />
        <button
          type="submit"
          className="btn btn-primary btn-large btn-block"
          disabled={busy}
        >
          {t('login.submit')}
        </button>
      </form>
      <p className="muted login-hint">{t('login.forgotHint')}</p>
    </div>
  )
}
