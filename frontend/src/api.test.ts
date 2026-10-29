import { describe, expect, it, vi } from 'vitest'

import { api, ApiError, toApiError } from './api'
import { fakeFetch } from './test/fakeFetch'

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError)
    return e as ApiError
  }
  throw new Error('expected the request to fail')
}

describe('api request errors', () => {
  it('reports "network" when no answer arrives at all', async () => {
    fakeFetch({ '/api/items': new TypeError('Failed to fetch') })
    const error = await failure(api.get('/api/items'))
    expect(error.code).toBe('apiError.network')
  })

  it('reports "network" when a gateway says the backend is down', async () => {
    fakeFetch({ '/api/items': { status: 502, text: '<html>Bad Gateway</html>' } })
    const error = await failure(api.get('/api/items'))
    expect(error.code).toBe('apiError.network')
  })

  it('reports "unknown" for a non-JSON crash page', async () => {
    fakeFetch({ '/api/items': { status: 500, text: 'Internal Server Error' } })
    const error = await failure(api.get('/api/items'))
    expect(error.code).toBe('apiError.unknown')
  })

  it('keeps the server error code and context', async () => {
    fakeFetch({
      'POST /api/items': {
        status: 409,
        body: { detail: { code: 'apiError.duplicateName', context: { name: 'Riz' } } },
      },
    })
    const error = await failure(api.post('/api/items', { name: 'Riz' }))
    expect(error.code).toBe('apiError.duplicateName')
    expect(error.context).toEqual({ name: 'Riz' })
  })
})

describe('toApiError', () => {
  it('turns a bug in our own code into a displayable error', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(toApiError(new TypeError('x is undefined')).code).toBe('apiError.unknown')
    expect(log).toHaveBeenCalled()
    log.mockRestore()
  })
})
