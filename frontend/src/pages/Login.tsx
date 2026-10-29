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
    <section className="login">
      <h1>{t('login.title')}</h1>
      <form onSubmit={submit}>
        <label>
          {t('login.email')}
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          {t('login.password')}
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <ErrorMessage error={error} />
        <p>
          <button type="submit" disabled={busy}>
            {t('login.submit')}
          </button>
        </p>
      </form>
      <p className="muted">{t('login.forgotHint')}</p>
    </section>
  )
}
