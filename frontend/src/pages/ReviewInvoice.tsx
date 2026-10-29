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
import ErrorMessage from '../components/ErrorMessage'
import { formatCents, formatQty } from '../format'

type AliasChoice = 'update' | 'line_only'

// The values in a confirmError.aliasConflict, ready for the message.
function aliasConflictVars(context: Record<string, unknown>) {
  return {
    savedItem: String(context.savedItemName),
    savedQty: formatQty(Number(context.savedQtyPerUnit), String(context.savedBaseUnit)),
    newItem: String(context.newItemName),
    newQty: formatQty(Number(context.newQtyPerUnit), String(context.newBaseUnit)),
  }
}

function LineCard({
  line,
  items,
  editable,
  onConfirmed,
  onItemCreated,
}: {
  line: InvoiceLine
  items: Item[]
  editable: boolean // invoice still pending, so a confirmed line can change
  onConfirmed: () => void
  onItemCreated: (item: Item) => void
}) {
  const { t, i18n } = useTranslation()
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
  const showForm = !confirmed || editing

  useEffect(() => {
    if (showForm) {
      api
        .get<Suggestion[]>(`/api/invoice-lines/${line.id}/suggestions`)
        .then(setSuggestions)
        .catch((e) => setError(toApiError(e)))
    }
  }, [line.id, showForm])

  if (!showForm) {
    return (
      <div className="line-card confirmed">
        <strong>{line.raw_text}</strong>
        <span>
          {line.item_name} —{' '}
          {t('review.confirmedAs', {
            qty: formatQty(line.qty_canonical ?? 0, line.item_base_unit ?? ''),
          })}
        </span>
        {editable && (
          <span>
            <button type="button" onClick={() => setEditing(true)}>
              {t('review.change')}
            </button>
          </span>
        )}
      </div>
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
    <div className="line-card">
      <strong>{line.raw_text}</strong>
      <span className="muted">
        {t('newInvoice.quantity')}: {line.quantity} ·{' '}
        {t('newInvoice.lineTotal')}:{' '}
        {formatCents(line.line_total_cents, i18n.resolvedLanguage ?? 'en')}
      </span>

      <div>
        <span className="muted">{t('review.suggestions')}: </span>
        {suggestions.length === 0 && (
          <span className="muted">{t('review.noSuggestions')}</span>
        )}
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
            {s.qty_per_unit ? ` (${s.qty_per_unit})` : ''}
          </button>
        ))}
      </div>

      <span className="row">
        <select value={itemId} onChange={(e) => chooseItem(e.target.value)}>
          <option value="" disabled>
            {t('review.chooseItem')}
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setCreating((v) => !v)}>
          {t('review.createNewItem')}
        </button>
      </span>

      {creating && (
        <span className="row">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('review.itemName')}
          />
          <select
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value as typeof newUnit)}
            aria-label={t('review.baseUnit')}
          >
            {(['g', 'ml', 'each'] as const).map((unit) => (
              <option key={unit} value={unit}>
                {t(`unit.${unit}`)}
              </option>
            ))}
          </select>
          <button type="button" onClick={createItem}>
            {t('newInvoice.create')}
          </button>
        </span>
      )}

      <label>
        {t('review.qtyPerUnit', {
          unit: t(`unit.${chosenItem?.base_unit ?? 'g'}`),
        })}
        <input
          className="narrow"
          value={qtyPerUnit}
          onChange={(e) => chooseQty(e.target.value)}
        />
      </label>

      {conflict && (
        <div className="warning-box" role="alert">
          <p>{t('review.aliasConflict', aliasConflictVars(conflict.context))}</p>
          <span className="row">
            <button type="button" onClick={() => confirm('update')}>
              {t('review.aliasUpdate')}
            </button>
            <button type="button" onClick={() => confirm('line_only')}>
              {t('review.aliasLineOnly')}
            </button>
            <button type="button" onClick={() => setConflict(null)}>
              {t('common.cancel')}
            </button>
          </span>
        </div>
      )}

      <ErrorMessage error={error} />
      {!conflict && (
        <span className="row">
          <button
            type="button"
            disabled={!itemId || !qtyPerUnit}
            onClick={() => confirm()}
          >
            {t('review.confirmLine')}
          </button>
          {editing && (
            <button type="button" onClick={cancelEditing}>
              {t('common.cancel')}
            </button>
          )}
        </span>
      )}
    </div>
  )
}

export default function ReviewInvoice() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<ApiError | null>(null)
  // loading the invoice or the item list failed (shown at the top)
  const [loadError, setLoadError] = useState<ApiError | null>(null)
  const [posted, setPosted] = useState<PostResult | null>(null)
  const language = i18n.resolvedLanguage ?? 'en'

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
    return loadError ? (
      <ErrorMessage error={loadError} />
    ) : (
      <p>{t('common.loading')}</p>
    )
  }

  const unconfirmed = invoice.lines.filter((l) => l.item_id === null).length

  if (posted) {
    return (
      <section>
        <h1>{invoice.supplier_name}</h1>
        <p className="success-box">{t('review.posted')}</p>
        <ul>
          {posted.balances.map((b) => (
            <li key={b.item_id}>
              {b.name}: {formatQty(b.qty, b.base_unit)} ·{' '}
              {formatCents(b.cost_cents, language)}
            </li>
          ))}
        </ul>
        <p>
          <Link to="/review">{t('review.backToQueue')}</Link>
        </p>
      </section>
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

  return (
    <section>
      <h1>
        {invoice.supplier_name}
        {invoice.invoice_number ? ` · ${invoice.invoice_number}` : ''}
      </h1>
      <p className="muted">
        {t('review.date')}: {invoice.invoice_date} · {t('review.total')}:{' '}
        {formatCents(invoice.total_cents, language)}
      </p>

      <ErrorMessage error={loadError} />

      {invoice.lines.map((line) => (
        <LineCard
          key={line.id}
          line={line}
          items={items}
          editable={invoice.status === 'pending_review'}
          onConfirmed={reload}
          onItemCreated={(item) =>
            setItems((old) =>
              [...old, item].sort((a, b) => a.name.localeCompare(b.name)),
            )
          }
        />
      ))}

      <p>
        {unconfirmed > 0
          ? t('review.linesToConfirm', { count: unconfirmed })
          : t('review.allConfirmed')}
      </p>
      <ErrorMessage error={error} />
      <button type="button" disabled={unconfirmed > 0} onClick={post}>
        {t('review.post')}
      </button>
    </section>
  )
}
