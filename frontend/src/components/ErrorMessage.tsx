import { useTranslation } from 'react-i18next'

import { ApiError } from '../api'
import { formatCents } from '../format'

// context keys holding cents that should display as money
const CENTS_KEYS: Record<string, string> = {
  linesSumCents: 'linesSum',
  subtotalCents: 'subtotal',
  partsSumCents: 'parts',
  totalCents: 'total',
}

// context keys holding a unit code ('g' / 'ml' / 'each') to translate
const UNIT_KEYS = ['textUnit', 'itemUnit']

export default function ErrorMessage({
  error,
  intro,
  tone = 'error',
}: {
  error: ApiError | null
  intro?: string // a sentence above the messages
  tone?: 'error' | 'warn' // warn: things to check, not failures
}) {
  const { t, i18n } = useTranslation()
  if (!error) return null

  const language = i18n.resolvedLanguage ?? 'en'
  const entries = error.errors.length
    ? error.errors
    : [{ code: error.code, context: error.context }]

  return (
    <div className={`notice notice-${tone}`} role="alert">
      {intro && <p className="notice-intro">{intro}</p>}
      {entries.map((entry, index) => {
        const vars: Record<string, unknown> = { ...entry.context }
        for (const [centsKey, name] of Object.entries(CENTS_KEYS)) {
          if (typeof vars[centsKey] === 'number') {
            vars[name] = formatCents(vars[centsKey] as number, language)
          }
        }
        if (typeof vars.field === 'string') {
          vars.field = t(`field.${vars.field}`)
        }
        for (const unitKey of UNIT_KEYS) {
          if (typeof vars[unitKey] === 'string') {
            vars[unitKey] = t(`unit.${vars[unitKey]}`)
          }
        }
        // a wait in minutes reads "12 min", or from an hour up "22 h"
        // (rounded up, so it never says to come back too early)
        const minutes = vars.minutes
        if (typeof minutes === 'number') {
          vars.wait =
            minutes < 60
              ? t('wait.minutes', { n: minutes })
              : t('wait.hours', { n: Math.ceil(minutes / 60) })
        }
        // a message about one line has its own wording ("Line 2: ...")
        const lineKey = `${entry.code}Line`
        const key = vars.line != null && i18n.exists(lineKey) ? lineKey : entry.code
        return <p key={index}>{t(key, vars as Record<string, string>)}</p>
      })}
    </div>
  )
}
