// Small typed helpers around fetch. API errors carry i18n codes that
// the UI translates — never English sentences from the server.

export class ApiError extends Error {
  code: string
  context: Record<string, unknown>
  errors: { code: string; context: Record<string, unknown> }[]

  constructor(payload: unknown, status: number) {
    super(`API error ${status}`)
    const body = (payload ?? {}) as Record<string, unknown>
    // shape A: {code, context}   (409 from LedgerError)
    // shape B: {detail: {code, context}}   (HTTPException)
    // shape C: {detail: {errors: [{code, context}, ...]}}   (422 validation)
    const detail = (body.detail ?? body) as Record<string, unknown>
    this.code = (detail.code as string) ?? 'apiError.unknown'
    this.context = (detail.context as Record<string, unknown>) ?? {}
    this.errors = (detail.errors as ApiError['errors']) ?? []
    if (this.errors.length === 0 && detail.code) {
      this.errors = [{ code: this.code, context: this.context }]
    }
  }
}

// A gateway in front of the backend answers with these when the backend
// itself is down or unreachable.
const GATEWAY_STATUSES = [502, 503, 504]

// Called whenever the server answers 401 "not logged in" (the session
// expired, or the account was deactivated): the app then shows the login
// page. AuthProvider sets it.
let onUnauthorized: () => void = () => {}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    // fetch only rejects when no answer arrived at all (offline, server down)
    throw new ApiError({ code: 'apiError.network' }, 0)
  }
  if (GATEWAY_STATUSES.includes(response.status)) {
    throw new ApiError({ code: 'apiError.network' }, response.status)
  }

  let payload: unknown = null
  if (response.status !== 204) {
    try {
      payload = await response.json()
    } catch {
      // not JSON (e.g. a plain-text crash page): nothing more specific to show
      throw new ApiError(null, response.status)
    }
  }
  if (response.status === 401) onUnauthorized()
  if (!response.ok) throw new ApiError(payload, response.status)
  return payload as T
}

// Anything a failed API call can throw, as an ApiError the UI can display.
// Never drop an error silently: the user must see that something failed.
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  console.error(error) // a bug in our own code — keep the details for debugging
  return new ApiError(null, 0)
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  // Files (e.g. a photo): no JSON content type, so the browser can set the
  // multipart one itself.
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form, headers: {} }),
}

// --- shared response types -------------------------------------------------

export interface Supplier {
  id: number
  name: string
}

export interface Item {
  id: number
  name: string
  base_unit: 'g' | 'ml' | 'each'
}

export interface QueueInvoice {
  id: number
  supplier_name: string
  invoice_number: string | null
  invoice_date: string
  total_cents: number
  line_count: number
  unconfirmed_lines: number
  posted_at: string | null // when it was added to stock
}

// One row of the stock list: read straight from the ledger (GET /api/stock).
export interface StockRow {
  id: number
  name: string
  base_unit: 'g' | 'ml' | 'each'
  qty: number // whole base units
  spent_cents: number
  last_delivery: string | null // YYYY-MM-DD
}

export interface InvoiceLine {
  id: number
  raw_text: string
  quantity: string
  line_total_cents: number
  item_id: number | null
  item_name: string | null
  item_base_unit: string | null
  qty_canonical: number | null
  prefill: { baseUnit: string; qtyPerUnit: number } | null
}

export interface InvoiceDetail {
  id: number
  supplier_name: string
  invoice_number: string | null
  invoice_date: string
  subtotal_cents: number
  gst_cents: number
  qst_cents: number
  other_tax_cents: number
  total_cents: number
  status: string
  lines: InvoiceLine[]
  photo_id: number | null // the photo this invoice was read from, if any
  posted_at: string | null // when it was added to stock (null before that)
}

// What the AI read from a photo, as form text, after deterministic checks
// (backend app/extraction.py). Problems are i18n codes.
export interface InvoiceDraft {
  supplier_name_read: string
  supplier_id: number | null
  invoice_number: string
  invoice_date: string // YYYY-MM-DD, or '' when it couldn't be read for sure
  invoice_date_read: string
  lines: { raw_text: string; quantity: string; line_total: string }[]
  subtotal: string
  gst: string
  qst: string
  other_tax: string
  total: string
  problems: { code: string; context: Record<string, unknown> }[]
}

export interface PhotoResult {
  id: number
  status: 'waiting' | 'read' | 'failed'
  draft: InvoiceDraft | null
  invoice_id?: number | null // set once the photo was saved as an invoice
}

export interface PendingPhoto {
  id: number
  status: 'waiting' | 'read' | 'failed'
  uploaded_at: string
  uploaded_by: string
}

export interface Suggestion {
  item_id: number
  name: string
  base_unit: string
  qty_per_unit: number | null
  score: number
}

export interface PostResult {
  entryIds: number[]
  balances: {
    item_id: number
    name: string
    base_unit: string
    qty: number
    cost_cents: number
  }[]
}
