// Home, Stock and Posted invoices: the screens added in the redesign.

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { QueueInvoice, StockRow } from '../api'
import { AsUser } from '../test/AsUser'
import { fakeFetch } from '../test/fakeFetch'
import Home from './Home'
import Posted from './Posted'
import Stock from './Stock'

function renderAsOwner(page: ReactNode) {
  render(
    <AsUser role="owner">
      <MemoryRouter>{page}</MemoryRouter>
    </AsUser>,
  )
}

const postedInvoice: QueueInvoice = {
  id: 7,
  supplier_name: 'Marché Central',
  invoice_number: 'F-1001',
  invoice_date: '2026-10-01',
  total_cents: 6324,
  line_count: 2,
  unconfirmed_lines: 0,
  posted_at: '2026-10-02T14:30:00Z',
}

describe('Home', () => {
  it('lists what needs doing and what was just added to stock', async () => {
    fakeFetch({
      '/api/invoice-photos': {
        body: [{ id: 1, status: 'waiting', uploaded_at: '2026-10-02T10:00:00Z', uploaded_by: 'bo@resto.ca' }],
      },
      '/api/invoices': { body: [{ ...postedInvoice, id: 8, unconfirmed_lines: 2 }, { ...postedInvoice, id: 9 }] },
      '/api/invoices?status=posted&limit=5': { body: [postedInvoice] },
    })
    renderAsOwner(<Home />)

    expect(await screen.findByText('1 photo to finish')).toBeInTheDocument()
    expect(screen.getByText('2 invoices to check')).toBeInTheDocument()
    const recent = screen.getByRole('link', { name: /Marché Central/ })
    expect(recent).toHaveAttribute('href', '/review/7')
    expect(within(recent).getByText('$63.24')).toBeInTheDocument()
  })

  it('says what to do next when nothing is waiting', async () => {
    fakeFetch({
      '/api/invoice-photos': { body: [] },
      '/api/invoices': { body: [] },
      '/api/invoices?status=posted&limit=5': { body: [] },
    })
    renderAsOwner(<Home />)
    expect(await screen.findByText(/Nothing waiting/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add an invoice' })).toHaveAttribute('href', '/add')
  })
})

describe('Stock', () => {
  const rows: StockRow[] = [
    { id: 1, name: 'Crème 35%', base_unit: 'ml', qty: 4000, spent_cents: 1899, last_delivery: '2026-10-01' },
    { id: 2, name: 'Tomates Roma', base_unit: 'g', qty: 10000, spent_cents: 3000, last_delivery: null },
  ]

  it('shows quantity in friendly units, spend and last delivery', async () => {
    fakeFetch({ '/api/stock': { body: rows } })
    renderAsOwner(<Stock />)

    const cream = (await screen.findByText('Crème 35%')).closest('li')!
    expect(within(cream).getByText('4 L')).toBeInTheDocument()
    expect(within(cream).getByText('$18.99 spent')).toBeInTheDocument()
    expect(within(cream).getByText('Last delivery Oct 1, 2026')).toBeInTheDocument()
    const tomatoes = screen.getByText('Tomates Roma').closest('li')!
    expect(within(tomatoes).getByText('No delivery yet')).toBeInTheDocument()
  })

  it('finds items without typing accents', async () => {
    const user = userEvent.setup()
    fakeFetch({ '/api/stock': { body: rows } })
    renderAsOwner(<Stock />)

    await user.type(await screen.findByLabelText('Search items'), 'creme')

    expect(screen.getByText('Crème 35%')).toBeInTheDocument()
    expect(screen.queryByText('Tomates Roma')).not.toBeInTheDocument()
  })
})

describe('Posted invoices', () => {
  it('searches by supplier and opens the read-only invoice', async () => {
    const user = userEvent.setup()
    fakeFetch({
      '/api/invoices?status=posted': {
        body: [postedInvoice, { ...postedInvoice, id: 8, supplier_name: 'Boulangerie Rive-Sud' }],
      },
    })
    renderAsOwner(<Posted />)

    await user.type(
      await screen.findByLabelText('Search by supplier or invoice number'),
      'boulangerie',
    )

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/review/8')
  })
})
