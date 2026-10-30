import { useTranslation } from 'react-i18next'

import { formatCents, formatDate, formatDateTime, formatQty } from './format'

// The formatters from format.ts, already set to the reader's language.
export function useFormat() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  return {
    money: (cents: number) => formatCents(cents, language),
    qty: (qty: number, baseUnit: string) =>
      formatQty(qty, baseUnit, language, t('unit.eachShort')),
    date: (isoDate: string) => formatDate(isoDate, language),
    dateTime: (isoTimestamp: string) => formatDateTime(isoTimestamp, language),
  }
}
