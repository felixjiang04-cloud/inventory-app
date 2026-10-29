import { describe, expect, it } from 'vitest'

import en from './en.json'
import fr from './fr.json'
import zh from './zh.json'

// Every key path in a nested translation file, e.g. "review.post".
function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj)
    .flatMap(([key, value]) =>
      typeof value === 'object' && value !== null
        ? keys(value, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    )
    .sort()
}

// A key missing from one language would silently show English (or the raw
// key) to that user — so the three files must always have identical keys.
describe('translation files', () => {
  it('French has exactly the English keys', () => {
    expect(keys(fr)).toEqual(keys(en))
  })

  it('Chinese has exactly the English keys', () => {
    expect(keys(zh)).toEqual(keys(en))
  })
})
