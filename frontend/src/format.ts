// Display-only formatting. All amounts arrive as integer cents computed
// by the backend; this file never does ledger math.

const LOCALES: Record<string, string> = {
  en: 'en-CA',
  fr: 'fr-CA',
  zh: 'zh-CN',
}

export function formatCents(cents: number, language: string): string {
  return new Intl.NumberFormat(LOCALES[language] ?? 'en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(cents / 100)
}

export function formatQty(qty: number, baseUnit: string): string {
  // base units are integers; show them plainly (10000 g, 3000 ml, 24 each)
  return `${qty.toLocaleString()} ${baseUnit}`
}
