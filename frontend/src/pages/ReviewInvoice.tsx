import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { api, ApiError, toApiError } from '../api'
import type {
  InvoiceDetail,
  InvoiceLine,
  Item,
  PostResult,
  Suggestion,
} from '../api'
import { useIsOwner } from '../auth'
import ErrorMessage from '../components/ErrorMessage'
import { useFormat } from '../useFormat'

type AliasChoice = 'update' | 'line_only'
type Format = ReturnType<typeof useFormat>

// The values in a confirmError.aliasConflict, ready for the message.
function aliasConflictVars(context: Record<string, unknown>, format: Format) {
  return {
    savedItem: String(context.savedItemName),
    savedQty: format.qty(Number(context.savedQtyPerUnit), String(context.savedBaseUnit)),
    newItem: String(context.newItemName),
    newQty: format.qty(Number(context.newQtyPerUnit), String(context.newBaseUnit)),
  }
}

function LineCard({
  line,
  items,
  canEdit,
  onConfirmed,
  onItemCreated,
}: {
  line: InvoiceLine
  items: Item[]
  canEdit: boolean // the owner, and the invoice is still pending
  onConfirmed: () => void
  onItemCreated: (item: Item) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [itemId, setItemId] = useState(
    line.item_id !== null ? String(line.item_id) : '',
  )
  const [qtyPerUnit, setQtyPerUnit] = useState(
    line.prefill ? String(line.prefill.qtyPerUnit) : '',
  )
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState<'g' | 'ml' | 'each'>(
    (line.prefill?.baseUnit as 'g' | 'ml' | 'each') ?? 'g',
  )
  const [error, setError] = useState<ApiError | null>(null)
  // re-opening an already-confirmed line (e.g. the pack size changed)
  const [editing, setEditing] = useState(false)
  // this spelling is saved with other values: the owner must pick which wins
  const [conflict, setConflict] = useState<ApiError | null>(null)

  const confirmed = line.item_id !== null
  const showForm = canEdit && (!confirmed || editing)
  const fieldId = (name: string) => `line-${line.id}-${name}`

  useEffect(() => {
    if (showForm) {
      api
        .get<Suggestion[]>(`/api/invoice-lines/${line.id}/suggestions`)
        .then(setSuggestions)
        .catch((e) => setError(toApiError(e)))
    }
  }, [line.id, showForm])

  const head = (
    <>
      <div className="line-card-head">
        <span className="line-card-text">{line.raw_text}</span>
        <span className="num">{format.money(line.line_total_cents)}</span>
      </div>
      <p className="list-row-meta">
        {t('newInvoice.quantity')}: {line.quantity}
      </p>
    </>
  )

  if (!showForm) {
    return (
      <li className={confirmed ? 'line-card line-card-done' : 'line-card'}>
        {head}
        {confirmed ? (
          <p className="line-card-result">
            {line.item_name} ·{' '}
            {t('review.confirmedAs', {
              qty: format.qty(line.qty_canonical ?? 0, line.item_base_unit ?? ''),
            })}
          </p>
        ) : (
          <p className="muted">{t('review.waitingForOwner')}</p>
        )}
        {confirmed && canEdit && (
          <button type="button" className="btn btn-quiet" onClick={() => setEditing(true)}>
            {t('review.change')}
          </button>
        )}
      </li>
    )
  }

  // Changing the values makes an open "which wins?" question stale.
  function chooseItem(id: string) {
    setItemId(id)
    setConflict(null)
  }

  function chooseQty(qty: string) {
    setQtyPerUnit(qty)
    setConflict(null)
  }

  function cancelEditing() {
    setEditing(false)
    setConflict(null)
    setError(null)
  }

  async function createItem() {
    if (!newName.trim()) return
    setError(null)
    try {
      const item = await api.post<Item>('/api/items', {
        name: newName,
        base_unit: newUnit,
      })
      onItemCreated(item)
      setItemId(String(item.id))
      setCreating(false)
    } catch (e) {
      setError(toApiError(e))
    }
  }

  async function confirm(aliasChoice?: AliasChoice) {
    setError(null)
    try {
      await api.put(`/api/invoice-lines/${line.id}/confirm`, {
        item_id: Number(itemId),
        qty_per_unit: Number(qtyPerUnit),
        alias_choice: aliasChoice ?? null,
      })
      setConflict(null)
      setEditing(false)
      onConfirmed()
    } catch (e) {
      const apiError = toApiError(e)
      if (apiError.code === 'confirmError.aliasConflict') {
        setConflict(apiError)
      } else {
        setConflict(null)
        setError(apiError)
      }
    }
  }

  const chosenItem = items.find((i) => String(i.id) === itemId)

  return (
    <li className="line-card">
      {head}

      <div className="field">
        <span className="field-label">{t('review.suggestions')}</span>
        {suggestions.length === 0 ? (
          <p className="field-hint">{t('review.noSuggestions')}</p>
        ) : (
          <div className="cluster">
            {suggestions.map((s) => (
              <button
                key={`${s.item_id}-${s.qty_per_unit ?? 'name'}`}
                type="button"
                className="chip"
                onClick={() => {
                  chooseItem(String(s.item_id))
                  if (s.qty_per_unit) chooseQty(String(s.qty_per_unit))
                }}
              >
                {s.name}
                {s.qty_per_unit ? ` (${format.qty(s.qty_per_unit, s.base_unit)})` : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor={fieldId('item')}>{t('review.item')}</label>
        <select
          id={fieldId('item')}
          value={itemId}
          onChange={(e) => chooseItem(e.target.value)}
        >
          <option value="" disabled>
            {t('review.chooseItem')}
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-quiet" onClick={() => setCreating((v) => !v)}>
          {t('review.createNewItem')}
        </button>
      </div>

      {creating && (
        <div className="field-panel">
          <div className="field">
            <label htmlFor={fieldId('new-name')}>{t('review.itemName')}</label>
            <input
              id={fieldId('new-name')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={fieldId('new-unit')}>{t('review.baseUnit')}</label>
            <select
              id={fieldId('new-unit')}
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value as typeof newUnit)}
            >
              {(['g', 'ml', 'each'] as const).map((unit) => (
                <option key={unit} value={unit}>
                  {t(`unit.${unit}`)}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn" onClick={createItem}>
            {t('newInvoice.create')}
          </button>
        </div>
      )}

      <div className="field">
        <label htmlFor={fieldId('qty-per-unit')}>
          {t('review.qtyPerUnit', {
            unit: t(`unit.${chosenItem?.base_unit ?? 'g'}`),
          })}
        </label>
        <input
          id={fieldId('qty-per-unit')}
          className="num"
          inputMode="numeric"
          value={qtyPerUnit}
          onChange={(e) => chooseQty(e.target.value)}
        />
      </div>

      {conflict && (
        <div className="notice notice-warn" role="alert">
          <p>{t('review.aliasConflict', aliasConflictVars(conflict.context, format))}</p>
          <div className="cluster notice-actions">
            <button type="button" className="btn" onClick={() => confirm('update')}>
              {t('review.aliasUpdate')}
            </button>
            <button type="button" className="btn" onClick={() => confirm('line_only')}>
              {t('review.aliasLineOnly')}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => setConflict(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <ErrorMessage error={error} />
      {!conflict && (
        <div className="cluster">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!itemId || !qtyPerUnit}
            onClick={() => confirm()}
          >
            {t('review.confirmLine')}
          </button>
          {editing && (
            <button type="button" className="btn btn-quiet" onClick={cancelEditing}>
              {t('common.cancel')}
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export default function ReviewInvoice() {
  const { t } = useTranslation()
  const format = useFormat()
  const { id } = useParams()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<ApiError | null>(null)
  // loading the invoice or the item list failed (shown at the top)
  const [loadError, setLoadError] = useState<ApiError | null>(null)
  const [posted, setPosted] = useState<PostResult | null>(null)
  const isOwner = useIsOwner() // only the owner confirms lines and adds to stock

  const reload = useCallback(() => {
    api
      .get<InvoiceDetail>(`/api/invoices/${id}`)
      .then((detail) => {
        setInvoice(detail)
        setLoadError(null)
      })
      .catch((e) => setLoadError(toApiError(e)))
  }, [id])

  useEffect(() => {
    reload()
    api
      .get<Item[]>('/api/items')
      .then(setItems)
      .catch((e) => setLoadError(toApiError(e)))
  }, [reload])

  if (invoice === null) {
    return (
      <div className="page">
        {loadError ? (
          <ErrorMessage error={loadError} />
        ) : (
          <p className="muted">{t('common.loading')}</p>
        )}
      </div>
    )
  }

  if (posted) {
    return (
      <div className="page">
        <h1>{invoice.supplier_name}</h1>
        <div className="notice notice-ok">
          <p>{t('review.posted')}</p>
        </div>
        <ul className="list">
          {posted.balances.map((b) => (
            <li key={b.item_id}>
              <div className="list-row">
                <span className="list-row-main">
                  <span className="list-row-title">{b.name}</span>
                </span>
                <span className="list-row-end">
                  <span className="num">{format.qty(b.qty, b.base_unit)}</span>
                  <span className="num list-row-meta">{format.money(b.cost_cents)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="after-list">
          <Link className="btn" to="/review">
            {t('review.backToQueue')}
          </Link>
        </p>
      </div>
    )
  }

  async function post() {
    setError(null)
    try {
      setPosted(await api.post<PostResult>(`/api/invoices/${invoice!.id}/post`, {}))
    } catch (e) {
      setError(toApiError(e))
    }
  }

  const pending = invoice.status === 'pending_review'
  const unconfirmed = invoice.lines.filter((l) => l.item_id === null).length
  // lines still to confirm first; otherwise the printed order
  const lines = [...invoice.lines].sort(
    (a, b) => Number(a.item_id !== null) - Number(b.item_id !== null),
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1>{invoice.supplier_name}</h1>
        <span className="page-header-figure num">{format.money(invoice.total_cents)}</span>
      </div>
      <p className="muted">
        {format.date(invoice.invoice_date)}
        {invoice.invoice_number ? ` · ${invoice.invoice_number}` : ''}
      </p>
      {!pending && (
        <p>
          <span className="badge badge-ok">
            {invoice.posted_at
              ? t('review.addedOn', { date: format.dateTime(invoice.posted_at) })
              : t('review.added')}
          </span>
        </p>
      )}

      <ErrorMessage error={loadError} />

      {invoice.photo_id !== null && (
        <details className="photo-toggle">
          <summary>{t('review.showPhoto')}</summary>
          <img
            src={`/api/invoice-photos/${invoice.photo_id}/image`}
            alt={t('review.photoAlt')}
          />
        </details>
      )}

      <h2>
        {!pending
          ? t('newInvoice.lines')
          : unconfirmed > 0
            ? t('review.linesToConfirm', { count: unconfirmed })
            : t('review.allConfirmed')}
      </h2>
      <ol className="line-cards">
        {lines.map((line) => (
          <LineCard
            key={line.id}
            line={line}
            items={items}
            canEdit={isOwner && pending}
            onConfirmed={reload}
            onItemCreated={(item) =>
              setItems((old) =>
                [...old, item].sort((a, b) => a.name.localeCompare(b.name)),
              )
            }
          />
        ))}
      </ol>

      {pending && !isOwner && (
        <div className="notice notice-warn">
          <p>{t('review.ownerPosts')}</p>
        </div>
      )}
      {pending && isOwner && unconfirmed === 0 && (
        <div className="action-bar">
          <ErrorMessage error={error} />
          <button type="button" className="btn btn-primary btn-large btn-block" onClick={post}>
            {t('review.post')}
          </button>
        </div>
      )}
    </div>
  )
}
