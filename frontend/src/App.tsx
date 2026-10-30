import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'

import { useAuth } from './auth'
import ErrorMessage from './components/ErrorMessage'
import Icon from './components/Icon'
import LanguageSwitch from './components/LanguageSwitch'
import Home from './pages/Home'
import Login from './pages/Login'
import More from './pages/More'
import NewInvoice from './pages/NewInvoice'
import ReviewInvoice from './pages/ReviewInvoice'
import ReviewQueue from './pages/ReviewQueue'
import Staff from './pages/Staff'
import './App.css'

// The /style page exists only while developing (`npm run dev`); the
// production build drops it entirely.
const StyleGuide = import.meta.env.DEV ? lazy(() => import('./pages/StyleGuide')) : null

function Brand() {
  const { t } = useTranslation()
  return (
    <Link to="/" className="brand">
      <img src="/favicon.svg" alt="" width="24" height="24" />
      {t('appTitle')}
    </Link>
  )
}

function App() {
  const { t, i18n } = useTranslation()
  const { user, error } = useAuth()
  const location = useLocation()

  // Browser tab title and <html lang> follow the chosen language.
  useEffect(() => {
    document.title = t('appTitle')
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
  }, [t, i18n.resolvedLanguage])

  if (StyleGuide && location.pathname === '/style') {
    return (
      <Suspense fallback={null}>
        <StyleGuide />
      </Suspense>
    )
  }

  // Not logged in (or not known yet): just the name, the language and the
  // login form.
  if (!user) {
    let content
    if (error) content = <ErrorMessage error={error} /> // couldn't even ask
    else if (user === undefined) content = <p className="page">{t('common.loading')}</p>
    else content = <Login />
    return (
      <div className="public">
        <header className="topbar">
          <Brand />
          <LanguageSwitch />
        </header>
        <main className="content">{content}</main>
      </div>
    )
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Brand />
      </header>
      <nav className="mainnav" aria-label={t('nav.main')}>
        <NavLink to="/" end>
          <Icon name="home" />
          {t('nav.home')}
        </NavLink>
        <NavLink to="/add">
          <Icon name="add" />
          {t('nav.add')}
        </NavLink>
        <NavLink to="/review">
          <Icon name="check" />
          {t('nav.check')}
        </NavLink>
        <NavLink to="/more">
          <Icon name="more" />
          {t('nav.more')}
        </NavLink>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<NewInvoice />} />
          <Route path="/invoices/new" element={<NewInvoice />} />
          <Route path="/review" element={<ReviewQueue />} />
          <Route path="/review/:id" element={<ReviewInvoice />} />
          <Route path="/more" element={<More />} />
          <Route
            path="/staff"
            element={user.role === 'owner' ? <Staff /> : <Navigate to="/" />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
