import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { fakeFetch } from '../test/fakeFetch'
import ReviewQueue from './ReviewQueue'

describe('ReviewQueue', () => {
  it('shows the error, not "nothing to review", when loading fails', async () => {
    fakeFetch({ '/api/invoices': new TypeError('Failed to fetch') })
    render(
      <MemoryRouter>
        <ReviewQueue />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/could not reach the server/i)).toBeInTheDocument()
    expect(screen.queryByText(/nothing to review/i)).not.toBeInTheDocument()
  })
})
