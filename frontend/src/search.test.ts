import { describe, expect, it } from 'vitest'

import { matchesSearch } from './search'

describe('matchesSearch', () => {
  it('ignores accents and capitals', () => {
    expect(matchesSearch('Crème fraîche', 'creme')).toBe(true)
    expect(matchesSearch('MARCHÉ CENTRAL', 'marche')).toBe(true)
  })

  it('matches Chinese as typed', () => {
    expect(matchesSearch('番茄', '番')).toBe(true)
  })

  it('an empty search matches everything', () => {
    expect(matchesSearch('Riz', '  ')).toBe(true)
  })

  it('does not match unrelated text', () => {
    expect(matchesSearch('Riz', 'huile')).toBe(false)
  })
})
