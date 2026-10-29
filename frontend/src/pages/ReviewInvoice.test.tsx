import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { InvoiceDetail } from '../api'
import { AsUser } from '../test/AsUser'
import { fakeFetch, sentBody } from '../test/fakeFetch'
import ReviewInvoice from './ReviewInvoice'

const invoice: InvoiceDetail = {
  id: 1,
  supplier_name: 'Marché Test',
  invoice_number: 'F-1',
  invoice_date: '2026-10-01',
  subtotal_cents: 3000,
  gst_cents: 0,
  qst_cents: 0,
  other_tax_cents: 0,
  total_cents: 3000,
  status: 'pending_review',
  lines: [
    {
      id: 10,
      raw_text: 'TOMATE ROMA 5KG',
      quantity: '2',
      line_total_cents: 3000,
      item_id: null,
      item_name: null,
      item_base_unit: null,
      qty_canonical: null,
      prefill: { baseUnit: 'g', qtyPerUnit: 5000 },
    },
  ],
}

function renderPage(role: 'owner' | 'staff' = 'owner') {
  render(
    <AsUser role={role}>
      <MemoryRouter initialEntries={['/review/1']}>
        <Routes>
          <Route path="/review/:id" element={<ReviewInvoice />} />
        </Routes>
      </MemoryRouter>
    </AsUser>,
  )
}

const NETWORK = /could not reach the server/i

describe('ReviewInvoice error display', () => {
  it('shows an error when suggestions fail to load (was silently swallowed)', async () => {
    fakeFetch({
      '/api/invoices/1': { body: invoice },
      '/api/items': { body: [] },
      '/api/invoice-lines/10/suggestions': new TypeError('Failed to fetch'),
    })
    renderPage()
    expect(await screen.findByText(NETWORK)).toBeInTheDocument()
  })

  it('shows an error instead of "Loading…" forever when the invoice fails', async () => {
    fakeFetch({
      '/api/invoices/1': new TypeError('Failed to fetch'),
      '/api/items': { body: [] },
    })
    renderPage()
    expect(await screen.findByText(NETWORK)).toBeInTheDocument()
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
  })
})

describe('ReviewInvoice saved spellings', () => {
  const conflict = {
    status: 409,
    body: {
      detail: {
        code: 'confirmError.aliasConflict',
        context: {
          savedItemName: 'Tomates Roma',
          savedQtyPerUnit: 5000,
          savedBaseUnit: 'g',
          newItemName: 'Tomates Roma',
          newQtyPerUnit: 4000,
          newBaseUnit: 'g',
        },
      },
    },
  }

  it('asks which values win, then sends the owner\'s choice', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeFetch({
      '/api/invoices/1': { body: invoice },
      '/api/items': { body: [{ id: 5, name: 'Tomates Roma', base_unit: 'g' }] },
      '/api/invoice-lines/10/suggestions': { body: [] },
      'PUT /api/invoice-lines/10/confirm': [conflict, { body: {} }],
    })
    renderPage()

    await user.selectOptions(await screen.findByRole('combobox'), '5')
    const qty = screen.getByLabelText(/one invoice unit/i)
    await user.clear(qty)
    await user.type(qty, '4000')
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    // the saved and the new values are both shown before anything changes
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'already saved as Tomates Roma, 1 unit = 5,000 g. You entered Tomates Roma, 1 unit = 4,000 g.',
    )
    await user.click(screen.getByRole('button', { name: 'Use only for this invoice' }))

    const path = '/api/invoice-lines/10/confirm'
    expect(sentBody(fetchMock, path, 0).alias_choice).toBeNull()
    expect(sentBody(fetchMock, path, 1)).toEqual({
      item_id: 5,
      qty_per_unit: 4000,
      alias_choice: 'line_only',
    })
  })

  const confirmedLine = {
    ...invoice.lines[0],
    item_id: 5,
    item_name: 'Tomates Roma',
    item_base_unit: 'g',
    qty_canonical: 10000,
  }

  it('reopens a confirmed line of a pending invoice with "Change"', async () => {
    const user = userEvent.setup()
    fakeFetch({
      '/api/invoices/1': { body: { ...invoice, lines: [confirmedLine] } },
      '/api/items': { body: [{ id: 5, name: 'Tomates Roma', base_unit: 'g' }] },
      '/api/invoice-lines/10/suggestions': { body: [] },
    })
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Change' }))
    expect(screen.getByRole('combobox')).toHaveValue('5') // current item kept
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('offers no "Change" once the invoice is posted', async () => {
    fakeFetch({
      '/api/invoices/1': { body: { ...invoice, status: 'posted', lines: [confirmedLine] } },
      '/api/items': { body: [] },
    })
    renderPage()
    expect(await screen.findByText(/10,000 g recorded/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument()
  })
})

describe('ReviewInvoice for staff', () => {
  it('shows lines as waiting for the owner, with no confirm or post', async () => {
    const fetchMock = fakeFetch({
      '/api/invoices/1': { body: invoice },
      '/api/items': { body: [] },
    })
    renderPage('staff')

    expect(
      await screen.findByText('Waiting for the owner to confirm this line.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Post to ledger' })).not.toBeInTheDocument()
    expect(
      screen.getByText('Only the owner can post this invoice to the ledger.'),
    ).toBeInTheDocument()
    // and it doesn't even ask for suggestions it can't use
    const paths = fetchMock.mock.calls.map(([path]) => path)
    expect(paths).not.toContain('/api/invoice-lines/10/suggestions')
  })
})
