import { describe, expect, it, vi } from 'vitest'
import { getDb, getGoogleMapsServerKey } from '../server/utils/d1'

const createError = vi.fn((input: unknown) => input)
const useRuntimeConfig = vi.fn(() => ({ googleMapsServerKey: '' }))

vi.stubGlobal('createError', createError)
vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)

describe('Cloudflare binding helpers', () => {
  it('returns the D1 binding from the Cloudflare event context', () => {
    const db = { prepare: vi.fn(), batch: vi.fn() }

    expect(getDb({ context: { cloudflare: { env: { DB: db } } } } as never)).toBe(db)
  })

  it('throws a clear server error when DB is missing', () => {
    expect(() => getDb({ context: { cloudflare: { env: {} } } } as never)).toThrow()
    expect(createError).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'D1 database binding DB is not configured',
    })
  })

  it('prefers the Cloudflare secret for Google Maps server key', () => {
    useRuntimeConfig.mockReturnValueOnce({ googleMapsServerKey: 'runtime-key' })

    expect(getGoogleMapsServerKey({
      context: { cloudflare: { env: { GOOGLE_MAPS_SERVER_KEY: 'secret-key' } } },
    } as never)).toBe('secret-key')
  })

  it('falls back to runtime config for Google Maps server key', () => {
    useRuntimeConfig.mockReturnValueOnce({ googleMapsServerKey: 'runtime-key' })

    expect(getGoogleMapsServerKey({ context: { cloudflare: { env: {} } } } as never)).toBe('runtime-key')
  })
})
