import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/source-sans-3' // bundled: no request to Google
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './i18n'
import App from './App.tsx'
import AuthProvider from './components/AuthProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
