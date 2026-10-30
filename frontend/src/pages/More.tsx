import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth'
import LanguageSwitch from '../components/LanguageSwitch'

// Everything that doesn't need a tab of its own: typed entry, staff,
// language and the account.
export default function More() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <div className="page">
      <h1>{t('more.title')}</h1>
      <ul className="list">
        <li>
          <Link className="list-row" to="/invoices/new">
            <span className="list-row-main">
              <span className="list-row-title">{t('more.typeInvoice')}</span>
              <span className="list-row-meta">{t('more.typeInvoiceHint')}</span>
            </span>
          </Link>
        </li>
        <li>
          <Link className="list-row" to="/posted">
            <span className="list-row-main">
              <span className="list-row-title">{t('posted.title')}</span>
              <span className="list-row-meta">{t('more.postedHint')}</span>
            </span>
          </Link>
        </li>
        {user.role === 'owner' && (
          <li>
            <Link className="list-row" to="/staff">
              <span className="list-row-main">
                <span className="list-row-title">{t('nav.staff')}</span>
                <span className="list-row-meta">{t('more.staffHint')}</span>
              </span>
            </Link>
          </li>
        )}
      </ul>

      <h2>{t('language')}</h2>
      <LanguageSwitch />

      <h2>{t('more.account')}</h2>
      <p>{t('auth.loggedInAs', { email: user.email, role: t(`role.${user.role}`) })}</p>
      <button type="button" className="btn" onClick={logout}>
        {t('auth.logout')}
      </button>
    </div>
  )
}
