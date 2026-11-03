import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { applyLook } from '../look'
import { AsUser } from '../test/AsUser'
import More from './More'

afterEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.look
})

function renderMore() {
  render(
    <AsUser role="staff">
      <MemoryRouter>
        <More />
      </MemoryRouter>
    </AsUser>,
  )
}

describe('More: choosing a look', () => {
  it('offers the five looks, with the one on screen selected', () => {
    applyLook('ticket')
    renderMore()

    const group = screen.getByRole('radiogroup', { name: 'Look' })
    expect(within(group).getAllByRole('radio')).toHaveLength(5)
    const ticket = screen.getByRole('radio', { name: 'Ticket' })
    expect(ticket).toBeChecked()
    expect(ticket).toHaveAccessibleDescription(/kitchen order ticket/)
  })

  it('switches the look at once and remembers it on this device', async () => {
    const user = userEvent.setup()
    applyLook('ticket')
    renderMore()

    await user.click(screen.getByText('Like station signs: big, clear type on black bands.'))

    expect(document.documentElement.dataset.look).toBe('signal')
    expect(window.localStorage.getItem('look')).toBe('signal')
    expect(screen.getByRole('radio', { name: 'Signal' })).toBeChecked()
  })
})
