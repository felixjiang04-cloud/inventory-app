import { afterEach, describe, expect, it } from 'vitest'

import { chooseLook, currentLook, DEFAULT_LOOK, LOOKS, savedLook } from './look'

afterEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.look
})

describe('looks', () => {
  it('offers the five looks, Ticket first and by default', () => {
    expect(LOOKS).toEqual(['ticket', 'signal', 'bistro', 'patisserie', 'herbier'])
    expect(DEFAULT_LOOK).toBe('ticket')
    expect(savedLook()).toBe('ticket')
  })

  it('ignores a stored value that is not one of the looks', () => {
    window.localStorage.setItem('look', 'neon')
    expect(savedLook()).toBe('ticket')
  })

  it('shows the chosen look at once and remembers it on this device', () => {
    chooseLook('herbier')
    expect(document.documentElement.dataset.look).toBe('herbier')
    expect(currentLook()).toBe('herbier')
    expect(savedLook()).toBe('herbier')
  })
})
