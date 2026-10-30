import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { InvoiceDraft } from '../api'
import { AsUser } from '../test/AsUser'
import { fakeFetch, sentBody } from '../test/fakeFetch'
import PhotoInvoice from './PhotoInvoice'

const draft: InvoiceDraft = {
  supplier_name_read: 'MARCHÉ CENTRAL INC.',
  supplier_id: 3,
  invoice_number: 'F-2001',
  invoice_date: '2026-10-01',
  invoice_date_read: '2026-10-01',
  lines: [
    { raw_text: 'TOMATE ROMA 5KG', quantity: '2', line_total: '30.00' },
    { raw_text: 'HUILE OLIVE 3L', quantity: '1 CS', line_total: '25.00' },
  ],
  subtotal: '55.00',
  gst: '2.75',
  qst: '5.49',
  other_tax: '0',
  total: '63.24',
  problems: [
    {
      code: 'extractionError.unreadable',
      context: { field: 'quantity', read: '1 CS', line: 2 },
    },
  ],
}

const common = {
  '/api/invoice-photos': { body: [] },
  '/api/suppliers': { body: [{ id: 3, name: 'Marché Central' }] },
}

function renderPage() {
  render(
    <AsUser role="staff">
      <MemoryRouter initialEntries={['/add']}>
        <Routes>
          <Route path="/add" element={<PhotoInvoice />} />
          <Route path="/add/:id" element={<PhotoInvoice />} />
        </Routes>
      </MemoryRouter>
    </AsUser>,
  )
}

async function choosePhoto(user: ReturnType<typeof userEvent.setup>) {
  const photo = new File(['photo bytes'], 'invoice.jpg', { type: 'image/jpeg' })
  await user.upload(screen.getByLabelText('Take or choose a photo'), photo)
}

describe('Adding an invoice from a photo', () => {
  it('shows the form filled in from the photo, points at what to check, links the photo', async () => {
    const user = userEvent.setup()
    const fetchMock = fakeFetch({
      ...common,
      'POST /api/invoice-photos': { status: 201, body: { id: 7, status: 'read', draft } },
      'POST /api/invoices': { status: 201, body: { id: 42 } },
    })
    renderPage()

    await choosePhoto(user)

    expect(await screen.findByRole('heading', { name: 'Check what was read' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('TOMATE ROMA 5KG')).toBeInTheDocument()
    expect(screen.getByLabelText('Total as printed')).toHaveValue('63.24')
    // the line the checks couldn't read is named and outlined
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Line 2: couldn\'t read the quantity (read as “1 CS”).',
    )
    expect(screen.getByDisplayValue('1 CS')).toHaveClass('needs-check')
    expect(screen.getByDisplayValue('TOMATE ROMA 5KG')).not.toHaveClass('needs-check')

    await user.clear(screen.getByDisplayValue('1 CS'))
    await user.type(screen.getAllByLabelText('Qty')[1], '1')
    await user.click(screen.getByRole('button', { name: 'Save invoice' }))

    expect(await screen.findByText(/Invoice saved/)).toBeInTheDocument()
    expect(sentBody(fetchMock, '/api/invoices')).toMatchObject({
      supplier_id: 3,
      photo_id: 7,
      total: '63.24',
    })
  })

  it('keeps the photo when it cannot be read yet, and reads it on "Try again"', async () => {
    const user = userEvent.setup()
    fakeFetch({
      ...common,
      'POST /api/invoice-photos': { status: 201, body: { id: 8, status: 'waiting', draft: null } },
      'POST /api/invoice-photos/8/read': { body: { id: 8, status: 'read', draft } },
    })
    renderPage()

    await choosePhoto(user)
    expect(await screen.findByText(/can't be read right now/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Check what was read' })).toBeInTheDocument()
  })

  it('lets the invoice be typed in when the photo cannot be read', async () => {
    const user = userEvent.setup()
    fakeFetch({
      ...common,
      'POST /api/invoice-photos': { status: 201, body: { id: 9, status: 'failed', draft: null } },
    })
    renderPage()

    await choosePhoto(user)
    await user.click(await screen.findByRole('button', { name: 'Type it in' }))

    expect(screen.getByRole('heading', { name: 'Type an invoice' })).toBeInTheDocument()
    expect(screen.getByLabelText('Total as printed')).toHaveValue('')
  })

  it('shows why an upload was refused', async () => {
    const user = userEvent.setup()
    fakeFetch({
      ...common,
      'POST /api/invoice-photos': {
        status: 422,
        body: { detail: { code: 'photoError.notAnImage', context: {} } },
      },
    })
    renderPage()

    await choosePhoto(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/isn't a photo the app can open/)
  })
})
