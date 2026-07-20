import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

type ServerState = 'checking' | 'ok' | 'down'

const statusKey: Record<ServerState, string> = {
  checking: 'serverChecking',
  ok: 'serverOk',
  down: 'serverDown',
}

export default function Home() {
  const { t } = useTranslation()
  const [server, setServer] = useState<ServerState>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setServer(res.ok ? 'ok' : 'down'))
      .catch(() => setServer('down'))
  }, [])

  return (
    <section className="home">
      <h1>{t('appTitle')}</h1>
      <p>{t('tagline')}</p>
      <p>
        {t('serverStatus')}:{' '}
        <strong className={`status-${server}`}>{t(statusKey[server])}</strong>
      </p>
      <p className="home-links">
        <Link to="/invoices/new">{t('nav.newInvoice')}</Link>
        {' · '}
        <Link to="/review">{t('nav.review')}</Link>
      </p>
    </section>
  )
}
