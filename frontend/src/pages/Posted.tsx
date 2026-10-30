import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { api, ApiError, toApiError } from '../api'
import type { QueueInvoice } from '../api'
import ErrorMessage from '../components/ErrorMessage'
import { matchesSearch } from '../search'
import { useFormat } from '../useFormat'

// Every invoice already added to stock, newest first; each opens read-only.
export default function Posted() {
  const { t } = useTranslation()
  const format = useFormat()
  const [invoices, setInvoices] = useState<QueueInvoice[] | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    api
      .get<QueueInvoice[]>('/api/invoices?status=posted')
      .then(setInvoices)
      .catch((e) => setError(toApiError(e)))
  }, [])

  const shown =
    invoices?.filter(
      (invoice) =>
        matchesSearch(invoice.supplier_name, search) ||
        matchesSearch(invoice.invoice_number ?? '', search),
    ) ?? []

  return (
    <div className="page">
      <h1>{t('posted.title')}</h1>
      <ErrorMessage error={error} />
      {!error && invoices === null && <p className="muted">{t('common.loading')}</p>}

      {invoices?.length === 0 && (
        <div className="empty-state">
          <p>{t('home.recentEmpty')}</p>
        </div>
      )}
      {invoices && invoices.length > 0 && (
        <>
          <div className="field">
            <label htmlFor="posted-search" className="sr-only">
              {t('posted.search')}
            </label>
            <input
              id="posted-search"
              type="search"
              placeholder={t('posted.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {shown.length === 0 ? (
            <p className="muted">{t('posted.noMatch', { search: search.trim() })}</p>
          ) : (
            <ul className="list">
              {shown.map((invoice) => (
                <li key={invoice.id}>
                  <Link className="list-row" to={`/review/${invoice.id}`}>
                    <span className="list-row-main">
                      <span className="list-row-title">{invoice.supplier_name}</span>
                      <span className="list-row-meta">
                        {format.date(invoice.invoice_date)}
                        {invoice.invoice_number ? ` · ${invoice.invoice_number}` : ''}
                      </span>
                    </span>
                    <span className="num">{format.money(invoice.total_cents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
