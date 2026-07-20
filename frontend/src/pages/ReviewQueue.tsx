import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { api } from '../api'
import type { QueueInvoice } from '../api'
import { formatCents } from '../format'

export default function ReviewQueue() {
  const { t, i18n } = useTranslation()
  const [invoices, setInvoices] = useState<QueueInvoice[] | null>(null)
  const language = i18n.resolvedLanguage ?? 'en'

  useEffect(() => {
    api.get<QueueInvoice[]>('/api/invoices').then(setInvoices).catch(() => setInvoices([]))
  }, [])

  if (invoices === null) return <p>{t('common.loading')}</p>

  return (
    <section>
      <h1>{t('review.title')}</h1>
      {invoices.length === 0 && <p>{t('review.empty')}</p>}
      <ul className="queue">
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link to={`/review/${invoice.id}`}>
              <strong>{invoice.supplier_name}</strong>
              {invoice.invoice_number ? ` · ${invoice.invoice_number}` : ''}
              {' · '}
              {invoice.invoice_date}
              {' · '}
              {formatCents(invoice.total_cents, language)}
              <span
                className={
                  invoice.unconfirmed_lines > 0 ? 'badge pending' : 'badge done'
                }
              >
                {invoice.unconfirmed_lines > 0
                  ? t('review.linesToConfirm', {
                      count: invoice.unconfirmed_lines,
                    })
                  : t('review.allConfirmed')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
