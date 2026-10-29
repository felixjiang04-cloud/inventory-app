import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ApiError } from '../api'
import ErrorMessage from './ErrorMessage'

describe('ErrorMessage', () => {
  it('translates unit codes in a unit mismatch', () => {
    const error = new ApiError(
      {
        detail: {
          code: 'confirmError.unitMismatch',
          context: { textUnit: 'g', itemUnit: 'ml' },
        },
      },
      422,
    )
    render(<ErrorMessage error={error} />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      /in grams \(g\), but this item is counted in milliliters \(ml\)/,
    )
  })
})
