import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { api, ApiError, toApiError } from '../api'
import type { StockRow } from '../api'
import ErrorMessage from '../components/ErrorMessage'
import { matchesSearch } from '../search'
import { useFormat } from '../useFormat'

// What's on the shelf: every item's quantity on hand and what it cost,
// straight from the ledger (GET /api/stock).
export default function Stock() {
  const { t } = useTranslation()
  const format = useFormat()
  const [rows, setRows] = useState<StockRow[] | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    api
      .get<StockRow[]>('/api/stock')
      .then(setRows)
      .catch((e) => setError(toApiError(e)))
  }, [])

  const shown = rows?.filter((row) => matchesSearch(row.name, search)) ?? []

  return (
    <div className="page">
      <h1>{t('stock.title')}</h1>
      <ErrorMessage error={error} />
      {!error && rows === null && <p className="muted">{t('common.loading')}</p>}

      {rows?.length === 0 && (
        <div className="empty-state">
          <p>{t('stock.empty')}</p>
        </div>
      )}
      {rows && rows.length > 0 && (
        <>
          <div className="field">
            <label htmlFor="stock-search" className="sr-only">
              {t('stock.search')}
            </label>
            <input
              id="stock-search"
              type="search"
              placeholder={t('stock.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {shown.length === 0 ? (
            <p className="muted">{t('stock.noMatch', { search: search.trim() })}</p>
          ) : (
            <ul className="list">
              {shown.map((row) => (
                <li key={row.id}>
                  <div className="list-row">
                    <span className="list-row-main">
                      <span className="list-row-title">{row.name}</span>
                      <span className="list-row-meta">
                        {row.last_delivery
                          ? t('stock.lastDelivery', { date: format.date(row.last_delivery) })
                          : t('stock.neverDelivered')}
                      </span>
                    </span>
                    <span className="list-row-end">
                      <span className="num stock-qty">{format.qty(row.qty, row.base_unit)}</span>
                      <span className="num list-row-meta">
                        {t('stock.spent', { amount: format.money(row.spent_cents) })}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
