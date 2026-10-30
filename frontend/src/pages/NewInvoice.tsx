import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { api, ApiError, toApiError } from '../api'
import type { Supplier } from '../api'
import { useIsOwner } from '../auth'
import ErrorMessage from '../components/ErrorMessage'

interface LineDraft {
  raw_text: string
  quantity: string
  line_total: string
}

const emptyLine = (): LineDraft => ({ raw_text: '', quantity: '1', line_total: '' })

export default function NewInvoice() {
  const { t } = useTranslation()
  const isOwner = useIsOwner() // only the owner may add suppliers
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
    api
      .get<Supplier[]>('/api/suppliers')
      .then(setSuppliers)
      .catch((e) => setError(toApiError(e)))
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
      setError(toApiError(e))
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
      setError(toApiError(e))
    } finally {
      setBusy(false)
    }
  }

  if (savedId !== null) {
    return (
      <div className="page">
        <h1>{t('newInvoice.title')}</h1>
        <div className="notice notice-ok">
          <p>{t('newInvoice.saved')}</p>
        </div>
        <Link className="btn btn-primary" to={`/review/${savedId}`}>
          {t('newInvoice.goReview')}
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>{t('newInvoice.title')}</h1>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="invoice-supplier">{t('newInvoice.supplier')}</label>
          <select
            id="invoice-supplier"
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
          {isOwner ? (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setCreatingSupplier((v) => !v)}
            >
              {t('newInvoice.newSupplier')}
            </button>
          ) : (
            <p className="field-hint">{t('newInvoice.askOwnerForSupplier')}</p>
          )}
        </div>
        {creatingSupplier && (
          <div className="field">
            <label htmlFor="invoice-new-supplier">{t('newInvoice.supplierName')}</label>
            <div className="input-with-button">
              <input
                id="invoice-new-supplier"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
              />
              <button type="button" className="btn" onClick={createSupplier}>
                {t('newInvoice.create')}
              </button>
            </div>
          </div>
        )}

        <div className="field-row">
          <div className="field">
            <label htmlFor="invoice-date">{t('newInvoice.invoiceDate')}</label>
            <input
              id="invoice-date"
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="invoice-number">{t('newInvoice.invoiceNumber')}</label>
            <input
              id="invoice-number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
        </div>

        <h2>{t('newInvoice.lines')}</h2>
        <ol className="line-entries">
          {lines.map((line, index) => (
            <li key={index} className="line-entry">
              <div className="line-entry-head">
                <span className="muted">
                  {t('newInvoice.lineNumber', { number: index + 1 })}
                </span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => setLines((old) => old.filter((_, i) => i !== index))}
                  >
                    {t('common.remove')}
                  </button>
                )}
              </div>
              <div className="field">
                <label htmlFor={`line-${index}-text`}>{t('newInvoice.rawText')}</label>
                <input
                  id={`line-${index}-text`}
                  required
                  value={line.raw_text}
                  onChange={(e) => setLine(index, { raw_text: e.target.value })}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor={`line-${index}-qty`}>{t('newInvoice.quantity')}</label>
                  <input
                    id={`line-${index}-qty`}
                    className="num"
                    inputMode="decimal"
                    required
                    value={line.quantity}
                    onChange={(e) => setLine(index, { quantity: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`line-${index}-total`}>{t('newInvoice.lineTotal')}</label>
                  <input
                    id={`line-${index}-total`}
                    className="num"
                    inputMode="decimal"
                    required
                    value={line.line_total}
                    onChange={(e) => setLine(index, { line_total: e.target.value })}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="btn"
          onClick={() => setLines((old) => [...old, emptyLine()])}
        >
          {t('newInvoice.addLine')}
        </button>

        <h2>{t('newInvoice.totals')}</h2>
        <div className="field-row">
          <div className="field">
            <label htmlFor="invoice-subtotal">{t('newInvoice.subtotal')}</label>
            <input
              id="invoice-subtotal"
              className="num"
              inputMode="decimal"
              required
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="invoice-gst">{t('newInvoice.gst')}</label>
            <input
              id="invoice-gst"
              className="num"
              inputMode="decimal"
              value={gst}
              onChange={(e) => setGst(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="invoice-qst">{t('newInvoice.qst')}</label>
            <input
              id="invoice-qst"
              className="num"
              inputMode="decimal"
              value={qst}
              onChange={(e) => setQst(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="invoice-other-tax">{t('newInvoice.otherTax')}</label>
            <input
              id="invoice-other-tax"
              className="num"
              inputMode="decimal"
              value={otherTax}
              onChange={(e) => setOtherTax(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="invoice-total">{t('newInvoice.total')}</label>
          <input
            id="invoice-total"
            className="num"
            inputMode="decimal"
            required
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>

        <div className="action-bar">
          <ErrorMessage error={error} />
          <button
            type="submit"
            className="btn btn-primary btn-large btn-block"
            disabled={busy}
          >
            {t('newInvoice.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
