import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { InvoiceDetail } from '../api'
import { fakeFetch } from '../test/fakeFetch'
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

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/review/1']}>
      <Routes>
        <Route path="/review/:id" element={<ReviewInvoice />} />
      </Routes>
    </MemoryRouter>,
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
