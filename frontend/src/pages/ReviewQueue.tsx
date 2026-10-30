import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { api, ApiError, toApiError } from '../api'
import type { QueueInvoice } from '../api'
import ErrorMessage from '../components/ErrorMessage'
import { useFormat } from '../useFormat'

// "Invoices to check": everything entered but not yet added to stock.
export default function ReviewQueue() {
  const { t } = useTranslation()
  const format = useFormat()
  const [invoices, setInvoices] = useState<QueueInvoice[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    // On failure, show the error — NOT an empty list, which would falsely
    // tell the owner there is nothing to check.
    api
      .get<QueueInvoice[]>('/api/invoices')
      .then(setInvoices)
      .catch((e) => setError(toApiError(e)))
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('review.title')}</h1>
      </div>
      <ErrorMessage error={error} />
      {!error && invoices === null && <p className="muted">{t('common.loading')}</p>}
      {invoices?.length === 0 && (
        <div className="empty-state">
          <p>{t('review.empty')}</p>
        </div>
      )}
      {invoices && invoices.length > 0 && (
        <ul className="list">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link className="list-row" to={`/review/${invoice.id}`}>
                <span className="list-row-main">
                  <span className="list-row-title">{invoice.supplier_name}</span>
                  <span className="list-row-meta">
                    {format.date(invoice.invoice_date)}
                    {invoice.invoice_number ? ` · ${invoice.invoice_number}` : ''}
                  </span>
                </span>
                <span className="list-row-end">
                  <span className="num">{format.money(invoice.total_cents)}</span>
                  {invoice.unconfirmed_lines > 0 ? (
                    <span className="badge badge-warn">
                      {t('review.toConfirm', { count: invoice.unconfirmed_lines })}
                    </span>
                  ) : (
                    <span className="badge badge-ok">{t('review.readyToAdd')}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
