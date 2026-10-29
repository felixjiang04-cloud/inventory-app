import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import App from './App'
import AuthProvider from './components/AuthProvider'
import { fakeFetch } from './test/fakeFetch'
import type { FakeRoute } from './test/fakeFetch'

const notLoggedIn = {
  status: 401,
  body: { detail: { code: 'authError.notLoggedIn', context: {} } },
}

function renderApp(path: string, routes: Record<string, FakeRoute | FakeRoute[]>) {
  fakeFetch({ '/api/health': { body: { status: 'ok' } }, ...routes })
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('logging in', () => {
  it('shows the login page, a wrong-password error, then the app', async () => {
    const user = userEvent.setup()
    renderApp('/', {
      '/api/auth/me': notLoggedIn,
      'POST /api/auth/login': [
        {
          status: 401,
          body: { detail: { code: 'authError.invalidCredentials', context: {} } },
        },
        { body: { id: 1, email: 'chef@resto.ca', role: 'owner' } },
      ],
    })

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    // nothing of the app is reachable before logging in
    expect(screen.queryByRole('link', { name: 'Review' })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'chef@resto.ca')
    await user.type(screen.getByLabelText('Password'), 'wrong one')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.')

    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('chef@resto.ca (owner)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Staff' })).toBeInTheDocument()
  })

  it('returns to the login page when the session expires mid-use', async () => {
    renderApp('/review', {
      '/api/auth/me': { body: { id: 1, email: 'chef@resto.ca', role: 'owner' } },
      '/api/invoices': notLoggedIn,
    })
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('gives staff no link to staff accounts', async () => {
    renderApp('/', {
      '/api/auth/me': { body: { id: 2, email: 'bo@resto.ca', role: 'staff' } },
    })
    expect(await screen.findByText('bo@resto.ca (staff)')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Staff' })).not.toBeInTheDocument()
  })
})
