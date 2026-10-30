import { describe, expect, it } from 'vitest'

import { formatCents, formatDate, formatQty } from './format'

// Some locales use no-break spaces between groups and units; compare
// with ordinary spaces.
const plain = (text: string) => text.replace(/[  ]/g, ' ')

describe('formatQty', () => {
  it('shows big weights and volumes in kg and L', () => {
    expect(formatQty(10000, 'g')).toBe('10 kg')
    expect(formatQty(3000, 'ml')).toBe('3 L')
  })

  it('keeps every gram exact when switching to kg', () => {
    expect(formatQty(1234, 'g')).toBe('1.234 kg')
  })

  it('keeps small amounts in their base unit', () => {
    expect(formatQty(950, 'g')).toBe('950 g')
    expect(formatQty(250, 'ml')).toBe('250 ml')
  })

  it('writes pieces with the translated word', () => {
    expect(formatQty(12, 'each', 'en', 'pcs')).toBe('12 pcs')
    expect(formatQty(12, 'each')).toBe('12')
  })

  it("uses the reader's decimal separator", () => {
    expect(formatQty(1500, 'g', 'fr')).toBe('1,5 kg')
  })
})

describe('formatDate', () => {
  it("writes a calendar date each language's way", () => {
    expect(formatDate('2026-10-01', 'en')).toBe('Oct 1, 2026')
    expect(plain(formatDate('2026-10-01', 'fr'))).toBe('1 oct. 2026')
    expect(formatDate('2026-10-01', 'zh')).toBe('2026年10月1日')
  })

  it('never shifts the date to the day before', () => {
    expect(formatDate('2026-01-01', 'en')).toBe('Jan 1, 2026')
  })

  it('returns anything unexpected unchanged', () => {
    expect(formatDate('soon', 'en')).toBe('soon')
  })
})

describe('formatCents', () => {
  it('formats Canadian dollars per language', () => {
    expect(formatCents(123456, 'en')).toBe('$1,234.56')
    expect(plain(formatCents(123456, 'fr'))).toBe('1 234,56 $')
  })
})
