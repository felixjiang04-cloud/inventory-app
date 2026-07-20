import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Route, Routes } from 'react-router-dom'

import { languages } from './i18n'
import Home from './pages/Home'
import NewInvoice from './pages/NewInvoice'
import ReviewInvoice from './pages/ReviewInvoice'
import ReviewQueue from './pages/ReviewQueue'
import './App.css'

function App() {
  const { t, i18n } = useTranslation()

  // Browser tab title and <html lang> follow the chosen language.
  useEffect(() => {
    document.title = t('appTitle')
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
  }, [t, i18n.resolvedLanguage])

  return (
    <>
      <header>
        <span className="brand">{t('appTitle')}</span>
        <nav aria-label={t('nav.home')}>
          <NavLink to="/" end>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/invoices/new">{t('nav.newInvoice')}</NavLink>
          <NavLink to="/review">{t('nav.review')}</NavLink>
        </nav>
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
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/invoices/new" element={<NewInvoice />} />
          <Route path="/review" element={<ReviewQueue />} />
          <Route path="/review/:id" element={<ReviewInvoice />} />
        </Routes>
      </main>
    </>
  )
}

export default App
