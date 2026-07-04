import { describe, expect, it } from 'vitest'
import { isDuplicatePlaceError } from '../server/utils/http'
import { createPharmacySchema, mapPharmacy, updatePharmacySchema } from '../server/utils/pharmacies'

describe('pharmacy validation', () => {
  it('accepts a minimal Google Place-backed pharmacy', () => {
    expect(createPharmacySchema.parse({ googlePlaceId: 'place-123' })).toEqual({
      googlePlaceId: 'place-123',
    })
  })

  it('rejects blank display strings after trimming', () => {
    expect(() => createPharmacySchema.parse({
      googlePlaceId: 'place-123',
      cachedName: '   ',
    })).toThrow()
  })

  it.each([
    [{ cachedLat: -91 }, 'latitude below range'],
    [{ cachedLat: 91 }, 'latitude above range'],
    [{ cachedLng: -181 }, 'longitude below range'],
    [{ cachedLng: 181 }, 'longitude above range'],
  ])('rejects %s', (coordinates) => {
    expect(() => createPharmacySchema.parse({
      googlePlaceId: 'place-123',
      ...coordinates,
    })).toThrow()
  })

  it('requires update payloads to contain a supported field', () => {
    expect(() => updatePharmacySchema.parse({})).toThrow('Expected at least one supported field')
  })

  it('accepts clearing the last visited date', () => {
    expect(updatePharmacySchema.parse({ lastVisitedOn: null })).toEqual({ lastVisitedOn: null })
  })
})

describe('mapPharmacy', () => {
  it('maps D1 rows into API pharmacy objects', () => {
    expect(mapPharmacy({
      id: 'pharmacy-1',
      google_place_id: 'place-123',
      is_stocked: 0,
      last_visited_on: '2026-07-03',
      cached_name: 'Apteka',
      cached_address: 'Rynek 1',
      cached_lat: 50.0614,
      cached_lng: 19.9366,
      google_details_cached_at: '2026-07-03T10:00:00.000Z',
      google_place_id_refreshed_at: '2026-07-03T10:00:00.000Z',
      created_at: '2026-07-01T10:00:00.000Z',
      updated_at: '2026-07-02T10:00:00.000Z',
    })).toEqual({
      id: 'pharmacy-1',
      googlePlaceId: 'place-123',
      isStocked: false,
      lastVisitedOn: '2026-07-03',
      cachedName: 'Apteka',
      cachedAddress: 'Rynek 1',
      cachedLat: 50.0614,
      cachedLng: 19.9366,
      googleDetailsCachedAt: '2026-07-03T10:00:00.000Z',
      googlePlaceIdRefreshedAt: '2026-07-03T10:00:00.000Z',
      createdAt: '2026-07-01T10:00:00.000Z',
      updatedAt: '2026-07-02T10:00:00.000Z',
      recentVisits: [],
    })
  })
})

describe('duplicate place detection', () => {
  it.each([
    'UNIQUE constraint failed: pharmacies.google_place_id',
    'SQLITE_CONSTRAINT: UNIQUE constraint failed',
  ])('detects D1 duplicate errors containing %s', (message) => {
    expect(isDuplicatePlaceError(new Error(message))).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isDuplicatePlaceError(new Error('network failed'))).toBe(false)
  })
})
