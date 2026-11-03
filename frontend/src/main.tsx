import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Fonts are bundled with the app: no request to Google. This is Ticket's,
// the default look; look.ts loads the others only when they're picked.
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/shell.css'
import './styles/looks/ticket.css'
import './styles/looks/signal.css'
import './styles/looks/bistro.css'
import './styles/looks/patisserie.css'
import './styles/looks/herbier.css'
import './i18n'
import App from './App.tsx'
import AuthProvider from './components/AuthProvider'
import { applyLook, savedLook } from './look'

// Before the first render, so the screen never flashes another look.
applyLook(savedLook())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
