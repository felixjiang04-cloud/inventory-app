import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'

import { useAuth } from './auth'
import ErrorMessage from './components/ErrorMessage'
import { languages } from './i18n'
import Home from './pages/Home'
import Login from './pages/Login'
import NewInvoice from './pages/NewInvoice'
import ReviewInvoice from './pages/ReviewInvoice'
import ReviewQueue from './pages/ReviewQueue'
import Staff from './pages/Staff'
import './App.css'

function App() {
  const { t, i18n } = useTranslation()
  const { user, error, logout } = useAuth()

  // Browser tab title and <html lang> follow the chosen language.
  useEffect(() => {
    document.title = t('appTitle')
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
  }, [t, i18n.resolvedLanguage])

  let content
  if (error) {
    content = <ErrorMessage error={error} /> // couldn't even ask who's logged in
  } else if (user === undefined) {
    content = <p>{t('common.loading')}</p>
  } else if (user === null) {
    content = <Login />
  } else {
    content = (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/invoices/new" element={<NewInvoice />} />
        <Route path="/review" element={<ReviewQueue />} />
        <Route path="/review/:id" element={<ReviewInvoice />} />
        <Route
          path="/staff"
          element={user.role === 'owner' ? <Staff /> : <Navigate to="/" />}
        />
      </Routes>
    )
  }

  return (
    <>
      <header>
        <span className="brand">{t('appTitle')}</span>
        {user && (
          <nav aria-label={t('nav.home')}>
            <NavLink to="/" end>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/invoices/new">{t('nav.newInvoice')}</NavLink>
            <NavLink to="/review">{t('nav.review')}</NavLink>
            {user.role === 'owner' && <NavLink to="/staff">{t('nav.staff')}</NavLink>}
          </nav>
        )}
        <nav className="lang" aria-label={t('language')}>
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
        {user && (
          <span className="who">
            {t('auth.loggedInAs', { email: user.email, role: t(`role.${user.role}`) })}
            <button type="button" onClick={logout}>
              {t('auth.logout')}
            </button>
          </span>
        )}
      </header>
      <main>{content}</main>
    </>
  )
}

export default App
