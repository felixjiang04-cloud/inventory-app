// Display-only formatting. All amounts arrive as integer cents computed
// by the backend; this file never does ledger math.

const LOCALES: Record<string, string> = {
  en: 'en-CA',
  fr: 'fr-CA',
  zh: 'zh-CN',
}

const locale = (language: string) => LOCALES[language] ?? 'en-CA'

export function formatCents(cents: number, language: string): string {
  return new Intl.NumberFormat(locale(language), {
    style: 'currency',
    currency: 'CAD',
  }).format(cents / 100)
}

// Bigger units, for reading only. The ledger always keeps whole grams,
// millilitres and pieces; this hand-written table only changes how a
// quantity is shown ("10000 g" reads as "10 kg").
const DISPLAY_UNITS: Record<string, { unit: string; per: number }> = {
  g: { unit: 'kg', per: 1000 },
  ml: { unit: 'L', per: 1000 },
}

export function formatQty(
  qty: number,
  baseUnit: string,
  language = 'en',
  eachLabel = '', // the word for pieces ("pcs", "个") from the translations
): string {
  const bigger = DISPLAY_UNITS[baseUnit]
  if (bigger && Math.abs(qty) >= bigger.per) {
    // up to 3 decimals, so whole grams stay exact: 1234 g -> 1.234 kg
    const value = new Intl.NumberFormat(locale(language), {
      maximumFractionDigits: 3,
    }).format(qty / bigger.per)
    return `${value} ${bigger.unit}`
  }
  const value = new Intl.NumberFormat(locale(language)).format(qty)
  if (baseUnit === 'each') return eachLabel ? `${value} ${eachLabel}` : value
  return `${value} ${baseUnit}`
}

// A calendar date such as "2026-10-01" (no time of day, so no time zone
// may shift it to the day before).
export function formatDate(isoDate: string, language: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return new Intl.DateTimeFormat(locale(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

// A moment such as an upload time, in the viewer's own time zone.
export function formatDateTime(isoTimestamp: string, language: string): string {
  return new Intl.DateTimeFormat(locale(language), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoTimestamp))
}
