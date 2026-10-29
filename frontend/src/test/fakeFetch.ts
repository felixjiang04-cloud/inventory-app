import { vi } from 'vitest'

// What the fake server answers for one request:
// - {status, body}: a JSON response (status defaults to 200)
// - {status, text}: a non-JSON response, like a crash page
// - an Error: no answer at all (fetch rejects, as when offline)
export type FakeRoute =
  | { status?: number; body?: unknown }
  | { status: number; text: string }
  | Error

// Replace the browser's fetch with a fake that answers by "METHOD /path"
// (a plain "/path" key means GET). Returns the mock so tests can inspect
// which requests were sent and with what body.
export function fakeFetch(routes: Record<string, FakeRoute>) {
  const mock = vi.fn(async (path: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    const route =
      routes[`${method} ${path}`] ?? (method === 'GET' ? routes[path] : undefined)
    if (route === undefined) {
      // shows up on screen as an untranslated key, so the test fails loudly
      return Response.json(
        { detail: { code: `test.unexpectedRequest ${method} ${path}` } },
        { status: 500 },
      )
    }
    if (route instanceof Error) throw route
    if ('text' in route) return new Response(route.text, { status: route.status })
    return Response.json(route.body ?? null, { status: route.status ?? 200 })
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

// The JSON body of the n-th request sent to `path` (for asserting payloads).
export function sentBody(mock: ReturnType<typeof fakeFetch>, path: string, n = 0) {
  const calls = mock.mock.calls.filter(([calledPath]) => calledPath === path)
  return JSON.parse(String(calls[n][1]?.body))
}
