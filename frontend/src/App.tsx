import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { languages } from './i18n'
import './App.css'

type ServerState = 'checking' | 'ok' | 'down'

const statusKey: Record<ServerState, string> = {
  checking: 'serverChecking',
  ok: 'serverOk',
  down: 'serverDown',
}

function App() {
  const { t, i18n } = useTranslation()
  const [server, setServer] = useState<ServerState>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setServer(res.ok ? 'ok' : 'down'))
      .catch(() => setServer('down'))
  }, [])

  // The browser tab title and <html lang> must follow the chosen language too.
  useEffect(() => {
    document.title = t('appTitle')
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
  }, [t, i18n.resolvedLanguage])

  return (
    <main>
      <h1>{t('appTitle')}</h1>
      <p>{t('tagline')}</p>
      <p>
        {t('serverStatus')}:{' '}
        <strong className={`status-${server}`}>{t(statusKey[server])}</strong>
      </p>
      <nav aria-label={t('language')}>
        {Object.entries(languages).map(([code, label]) => (
          <button
            key={code}
            type="button"
            disabled={i18n.resolvedLanguage === code}
            onClick={() => i18n.changeLanguage(code)}
          >
            {label}
          </button>
        ))}
      </nav>
    </main>
  )
}

export default App
