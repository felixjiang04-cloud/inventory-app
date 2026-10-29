// Runs before every test file.
import '@testing-library/jest-dom/vitest' // adds matchers like toBeInTheDocument()
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

import i18n from '../i18n'

// Tests assert on the English text; the real app detects the language.
await i18n.changeLanguage('en')

afterEach(() => {
  cleanup() // unmount whatever the test rendered
  vi.unstubAllGlobals() // undo any fake fetch
})
