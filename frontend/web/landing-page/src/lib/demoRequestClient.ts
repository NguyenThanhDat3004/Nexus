/**
 * Demo-request client, mock-first like the portals (see frontend README, guideline 4).
 *
 * Proposed contract (to be confirmed with backend before VITE_USE_MOCK_DEMO=false):
 *   POST {VITE_API_BASE_URL}/api/v1/demo-requests
 *   body    { "email": string, "company": string }
 *   201/202 accepted
 *   400/422 { "errors": { "email"?: string, "company"?: string } }
 *   429     too many requests
 */

export type DemoRequest = { email: string; company: string }

export type DemoRequestResult =
  | { ok: true }
  | { ok: false; reason: 'validation'; fieldErrors: Partial<Record<keyof DemoRequest, string>> }
  | { ok: false; reason: 'rate_limited' | 'network' | 'server' }

export interface DemoRequestClient {
  submit(request: DemoRequest): Promise<DemoRequestResult>
}

/** Resolves after a short delay. `fail@example.com` simulates a server error so the error state can be demoed. */
export const mockDemoRequestClient: DemoRequestClient = {
  async submit(request) {
    await new Promise((resolve) => setTimeout(resolve, 900))
    if (request.email.trim().toLowerCase() === 'fail@example.com') return { ok: false, reason: 'server' }
    return { ok: true }
  },
}

export function createHttpDemoRequestClient(baseUrl: string): DemoRequestClient {
  return {
    async submit(request) {
      let response: Response
      try {
        response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/demo-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
      } catch {
        return { ok: false, reason: 'network' }
      }

      if (response.ok) return { ok: true }
      if (response.status === 429) return { ok: false, reason: 'rate_limited' }
      if (response.status === 400 || response.status === 422) {
        const body = (await response.json().catch(() => null)) as { errors?: Partial<Record<keyof DemoRequest, string>> } | null
        return { ok: false, reason: 'validation', fieldErrors: body?.errors ?? {} }
      }
      return { ok: false, reason: 'server' }
    },
  }
}

const useMock = import.meta.env.VITE_USE_MOCK_DEMO !== 'false'
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const demoRequestClient: DemoRequestClient = useMock ? mockDemoRequestClient : createHttpDemoRequestClient(baseUrl)
