// Development-only page (/style): every colour and building block from
// src/styles in one place, so look decisions are made by looking.
// Not part of the production build (see App.tsx).

import { useTranslation } from 'react-i18next'

import LookPicker from '../components/LookPicker'
import { useFormat } from '../useFormat'
import './StyleGuide.css'

const COLOURS = [
  '--color-bg',
  '--color-surface',
  '--color-sunken',
  '--color-text',
  '--color-text-muted',
  '--color-border',
  '--color-border-strong',
  '--color-accent',
  '--color-accent-soft',
  '--color-ok',
  '--color-ok-soft',
  '--color-warn',
  '--color-warn-soft',
  '--color-danger',
  '--color-danger-soft',
]

// demo rows (sample data, not interface text)
const SAMPLE_ROWS = [
  { name: 'Marché Central', date: '2026-10-01', cents: 6324 },
  { name: 'Boulangerie Rive-Sud', date: '2026-09-28', cents: 999 },
  { name: 'Poissonnerie du Port', date: '2026-09-27', cents: 123456 },
]

export default function StyleGuide() {
  const { t } = useTranslation()
  const format = useFormat()

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('appTitle')}</h1>
        <code>/style</code>
      </div>

      {/* switch looks here to check every building block in each one */}
      <h2 id="sg-look">{t('look.title')}</h2>
      <LookPicker labelledBy="sg-look" />

      <h2>
        <code>tokens.css</code>
      </h2>
      <div className="swatches">
        {COLOURS.map((name) => (
          <div key={name} className="swatch">
            <span className="swatch-colour" style={{ background: `var(${name})` }} />
            <code>{name}</code>
          </div>
        ))}
      </div>

      <h2>
        <code>.btn</code>
      </h2>
      <div className="cluster">
        <button type="button" className="btn btn-primary">
          {t('newInvoice.submit')}
        </button>
        <button type="button" className="btn">
          {t('common.cancel')}
        </button>
        <button type="button" className="btn btn-quiet">
          {t('newInvoice.addLine')}
        </button>
        <button type="button" className="btn btn-danger">
          {t('staff.deactivate')}
        </button>
        <button type="button" className="btn btn-primary" disabled>
          {t('review.post')}
        </button>
      </div>
      <p />
      <button type="button" className="btn btn-primary btn-large btn-block">
        {t('review.post')}
      </button>

      <h2>
        <code>.field</code>
      </h2>
      <div className="field">
        <label htmlFor="sg-supplier">{t('newInvoice.supplier')}</label>
        <select id="sg-supplier" defaultValue="">
          <option value="" disabled>
            {t('newInvoice.chooseSupplier')}
          </option>
        </select>
        <p className="field-hint">{t('newInvoice.askOwnerForSupplier')}</p>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="sg-qty">{t('newInvoice.quantity')}</label>
          <input id="sg-qty" className="num" inputMode="decimal" defaultValue="2" />
        </div>
        <div className="field">
          <label htmlFor="sg-total">{t('newInvoice.lineTotal')}</label>
          <input
            id="sg-total"
            className="num needs-check"
            inputMode="decimal"
            defaultValue="3O,00"
          />
        </div>
      </div>

      <h2>
        <code>.badge</code> · <code>.notice</code>
      </h2>
      <div className="cluster">
        <span className="badge badge-ok">{t('review.allConfirmed')}</span>
        <span className="badge badge-warn">{t('review.linesToConfirm', { count: 3 })}</span>
        <span className="badge">{t('staff.inactive')}</span>
      </div>
      <p />
      <div className="notice notice-error" role="alert">
        <p>{t('apiError.network')}</p>
      </div>
      <div className="notice notice-warn">
        <p>{t('review.waitingForOwner')}</p>
      </div>
      <div className="notice notice-ok">
        <p>{t('staff.added')}</p>
      </div>

      <h2>
        <code>.list</code>
      </h2>
      <ul className="list">
        {SAMPLE_ROWS.map((row) => (
          <li key={row.name}>
            <a className="list-row" href="#list">
              <span className="list-row-main">
                <span className="list-row-title">{row.name}</span>
                <span className="list-row-meta">{format.date(row.date)}</span>
              </span>
              <span className="num">{format.money(row.cents)}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="muted">
        {format.qty(10000, 'g')} · {format.qty(1234, 'g')} · {format.qty(3000, 'ml')} ·{' '}
        {format.qty(12, 'each')}
      </p>

      <h2>
        <code>.line-card</code>
      </h2>
      <ol className="line-cards">
        <li className="line-card">
          <div className="line-card-head">
            <span className="line-card-text">TOMATES ROMA 5KG</span>
            <span className="num">{format.money(4500)}</span>
          </div>
          <p className="list-row-meta">
            {t('newInvoice.quantity')}: 3
          </p>
          <div className="field">
            <label htmlFor="sg-line-qty">{t('review.qtyPerUnit', { unit: t('unit.g') })}</label>
            <input
              id="sg-line-qty"
              className="num needs-check"
              inputMode="numeric"
              defaultValue="5000"
            />
          </div>
          <button type="button" className="btn btn-primary">
            {t('review.confirmLine')}
          </button>
        </li>
        <li className="line-card line-card-done">
          <div className="line-card-head">
            <span className="line-card-text">HUILE OLIVE 3L</span>
            <span className="num">{format.money(2500)}</span>
          </div>
          <p className="line-card-result">
            Huile d'olive · {t('review.confirmedAs', { qty: format.qty(3000, 'ml') })}
          </p>
        </li>
      </ol>

      <h2>
        <code>.chip</code> · <code>.empty-state</code>
      </h2>
      <div className="cluster">
        <button type="button" className="chip">
          Tomates Roma ({format.qty(5000, 'g')})
        </button>
        <button type="button" className="chip">
          Huile d'olive
        </button>
      </div>
      <p />
      <div className="empty-state">
        <p>{t('review.empty')}</p>
      </div>
    </div>
  )
}
