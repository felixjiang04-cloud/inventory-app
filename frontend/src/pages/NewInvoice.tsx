import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { api, ApiError } from '../api'
import type { Supplier } from '../api'
import ErrorMessage from '../components/ErrorMessage'

interface LineDraft {
  raw_text: string
  quantity: string
  line_total: string
}

const emptyLine = (): LineDraft => ({ raw_text: '', quantity: '1', line_total: '' })

export default function NewInvoice() {
  const { t } = useTranslation()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()])
  const [subtotal, setSubtotal] = useState('')
  const [gst, setGst] = useState('0')
  const [qst, setQst] = useState('0')
  const [otherTax, setOtherTax] = useState('0')
  const [total, setTotal] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get<Supplier[]>('/api/suppliers').then(setSuppliers).catch(() => {})
  }, [])

  const setLine = (index: number, patch: Partial<LineDraft>) =>
    setLines((old) => old.map((l, i) => (i === index ? { ...l, ...patch } : l)))

  async function createSupplier() {
    if (!newSupplierName.trim()) return
    setError(null)
    try {
      const created = await api.post<Supplier>('/api/suppliers', {
        name: newSupplierName,
      })
      setSuppliers((old) => [...old, created])
      setSupplierId(String(created.id))
      setCreatingSupplier(false)
      setNewSupplierName('')
    } catch (e) {
      if (e instanceof ApiError) setError(e)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await api.post<{ id: number }>('/api/invoices', {
        supplier_id: Number(supplierId),
        invoice_date: invoiceDate,
        invoice_number: invoiceNumber || null,
        lines,
        subtotal,
        gst,
        qst,
        other_tax: otherTax,
        total,
      })
      setSavedId(result.id)
    } catch (e) {
      if (e instanceof ApiError) setError(e)
    } finally {
      setBusy(false)
    }
  }

  if (savedId !== null) {
    return (
      <section>
        <h1>{t('newInvoice.title')}</h1>
        <p className="success-box">{t('newInvoice.saved')}</p>
        <p>
          <Link to={`/review/${savedId}`}>{t('newInvoice.goReview')}</Link>
        </p>
      </section>
    )
  }

  return (
    <section>
      <h1>{t('newInvoice.title')}</h1>
      <form onSubmit={submit}>
        <label>
          {t('newInvoice.supplier')}
          <span className="row">
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="" disabled>
                {t('newInvoice.chooseSupplier')}
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCreatingSupplier((v) => !v)}
            >
              {t('newInvoice.newSupplier')}
            </button>
          </span>
        </label>
        {creatingSupplier && (
          <span className="row">
            <input
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              placeholder={t('newInvoice.supplierName')}
            />
            <button type="button" onClick={createSupplier}>
              {t('newInvoice.create')}
            </button>
          </span>
        )}

        <label>
          {t('newInvoice.invoiceDate')}
          <input
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </label>
        <label>
          {t('newInvoice.invoiceNumber')}
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </label>

        <h2>{t('newInvoice.lines')}</h2>
        {lines.map((line, index) => (
          <div className="line-row" key={index}>
            <input
              required
              placeholder={t('newInvoice.rawText')}
              value={line.raw_text}
              onChange={(e) => setLine(index, { raw_text: e.target.value })}
            />
            <input
              required
              className="narrow"
              placeholder={t('newInvoice.quantity')}
              value={line.quantity}
              onChange={(e) => setLine(index, { quantity: e.target.value })}
            />
            <input
              required
              className="narrow"
              placeholder={t('newInvoice.lineTotal')}
              value={line.line_total}
              onChange={(e) => setLine(index, { line_total: e.target.value })}
            />
            {lines.length > 1 && (
              <button
                type="button"
                aria-label={t('common.remove')}
                onClick={() =>
                  setLines((old) => old.filter((_, i) => i !== index))
                }
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((old) => [...old, emptyLine()])}
        >
          {t('newInvoice.addLine')}
        </button>

        <div className="totals">
          <label>
            {t('newInvoice.subtotal')}
            <input
              required
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
            />
          </label>
          <label>
            {t('newInvoice.gst')}
            <input value={gst} onChange={(e) => setGst(e.target.value)} />
          </label>
          <label>
            {t('newInvoice.qst')}
            <input value={qst} onChange={(e) => setQst(e.target.value)} />
          </label>
          <label>
            {t('newInvoice.otherTax')}
            <input
              value={otherTax}
              onChange={(e) => setOtherTax(e.target.value)}
            />
          </label>
          <label>
            {t('newInvoice.total')}
            <input
              required
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </label>
        </div>

        <ErrorMessage error={error} />
        <button type="submit" disabled={busy}>
          {t('newInvoice.submit')}
        </button>
      </form>
    </section>
  )
}
