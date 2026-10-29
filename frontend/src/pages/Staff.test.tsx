import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AsUser } from '../test/AsUser'
import { fakeFetch, sentBody } from '../test/fakeFetch'
import Staff from './Staff'

// AsUser logs in as user id 1 — the owner row below
const users = [
  { id: 1, email: 'owner@example.test', role: 'owner', active: true },
  { id: 2, email: 'bo@resto.ca', role: 'staff', active: true },
]

describe('Staff page', () => {
  it('deactivates a staff member but never offers it on your own row', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeFetch({
      '/api/users': { body: users },
      'PUT /api/users/2/active': { body: { ...users[1], active: false } },
    })
    render(
      <AsUser role="owner">
        <Staff />
      </AsUser>,
    )

    const ownRow = (await screen.findByText('owner@example.test')).closest('li')!
    expect(within(ownRow).queryByRole('button')).not.toBeInTheDocument()

    const staffRow = screen.getByText('bo@resto.ca').closest('li')!
    await user.click(within(staffRow).getByRole('button', { name: 'Deactivate' }))

    expect(sentBody(fetchMock, '/api/users/2/active')).toEqual({ active: false })
    expect(await screen.findByText(/logged out everywhere/)).toBeInTheDocument()
  })

  it('shows the server\'s reason when a new account is refused', async () => {
    const user = userEvent.setup()
    fakeFetch({
      '/api/users': { body: users },
      'POST /api/users': {
        status: 422,
        body: { detail: { code: 'userError.passwordTooShort', context: { min: 8 } } },
      },
    })
    render(
      <AsUser role="owner">
        <Staff />
      </AsUser>,
    )

    await user.type(await screen.findByLabelText('Email'), 'new@resto.ca')
    await user.type(screen.getByLabelText('Initial password'), 'short')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The password needs at least 8 characters.',
    )
  })
})
