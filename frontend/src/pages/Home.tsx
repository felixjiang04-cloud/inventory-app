import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { api, ApiError, toApiError } from '../api'
import type { PendingPhoto, QueueInvoice } from '../api'
import ErrorMessage from '../components/ErrorMessage'
import { useFormat } from '../useFormat'

const RECENT = 5 // how many recently added invoices to show

// The first screen: what needs doing now, and what just went into stock.
export default function Home() {
  const { t } = useTranslation()
  const format = useFormat()
  const [photos, setPhotos] = useState<PendingPhoto[] | null>(null)
  const [toCheck, setToCheck] = useState<QueueInvoice[] | null>(null)
  const [recent, setRecent] = useState<QueueInvoice[] | null>(null)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<PendingPhoto[]>('/api/invoice-photos'),
      api.get<QueueInvoice[]>('/api/invoices'),
      api.get<QueueInvoice[]>(`/api/invoices?status=posted&limit=${RECENT}`),
    ])
      .then(([pendingPhotos, pendingInvoices, posted]) => {
        setPhotos(pendingPhotos)
        setToCheck(pendingInvoices)
        setRecent(posted)
      })
      .catch((e) => setError(toApiError(e)))
  }, [])

  const loaded = photos !== null && toCheck !== null && recent !== null
  const nothingToDo = loaded && photos.length === 0 && toCheck.length === 0

  return (
    <div className="page">
      <h1>{t('home.title')}</h1>
      <div className="home-actions">
        <Link className="btn btn-primary btn-large btn-block" to="/add">
          {t('home.addInvoice')}
        </Link>
        <Link className="btn btn-quiet" to="/invoices/new">
          {t('home.typeInstead')}
        </Link>
      </div>

      <ErrorMessage error={error} />
      {!loaded && !error && <p className="muted">{t('common.loading')}</p>}

      {nothingToDo && (
        <div className="empty-state">
          <p>{t('home.allClear')}</p>
        </div>
      )}
      {loaded && !nothingToDo && (
        <ul className="list">
          {photos.length > 0 && (
            <li>
              <Link className="list-row" to="/add">
                <span className="list-row-main">
                  <span className="list-row-title">
                    {t('home.photosToFinish', { count: photos.length })}
                  </span>
                  <span className="list-row-meta">{t('home.photosToFinishHint')}</span>
                </span>
                <span className="badge badge-warn">{photos.length}</span>
              </Link>
            </li>
          )}
          {toCheck.length > 0 && (
            <li>
              <Link className="list-row" to="/review">
                <span className="list-row-main">
                  <span className="list-row-title">
                    {t('home.invoicesToCheck', { count: toCheck.length })}
                  </span>
                  <span className="list-row-meta">{t('home.invoicesToCheckHint')}</span>
                </span>
                <span className="badge badge-warn">{toCheck.length}</span>
              </Link>
            </li>
          )}
        </ul>
      )}

      {loaded && (
        <>
          <h2>{t('home.recent')}</h2>
          {recent.length === 0 ? (
            <p className="muted">{t('home.recentEmpty')}</p>
          ) : (
            <>
              <ul className="list">
                {recent.map((invoice) => (
                  <li key={invoice.id}>
                    <Link className="list-row" to={`/review/${invoice.id}`}>
                      <span className="list-row-main">
                        <span className="list-row-title">{invoice.supplier_name}</span>
                        <span className="list-row-meta">
                          {format.date(invoice.invoice_date)}
                        </span>
                      </span>
                      <span className="num">{format.money(invoice.total_cents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="after-list">
                <Link to="/posted">{t('home.seeAllPosted')}</Link>
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
