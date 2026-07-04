import { describe, expect, it } from 'vitest'
import { daysBetweenLocalDates, localDateString, relativeVisitAge } from '../shared/utils/date'
import { getPharmacyMarkerState } from '../shared/utils/marker-state'

describe('date helpers', () => {
  it('formats local calendar dates without UTC conversion', () => {
    expect(localDateString(new Date(2026, 6, 3, 23, 30))).toBe('2026-07-03')
  })

  it('counts calendar days from date-only strings', () => {
    expect(daysBetweenLocalDates('2026-07-01', '2026-07-03')).toBe(2)
  })

  it('counts leap-day calendar boundaries', () => {
    expect(daysBetweenLocalDates('2024-02-28', '2024-03-01')).toBe(2)
  })

  it('rejects non-date-only strings', () => {
    expect(() => daysBetweenLocalDates('2026-07-03T00:00:00Z', '2026-07-04')).toThrow('Expected YYYY-MM-DD date strings')
  })

  it.each([
    [null, 'Never'],
    ['2026-07-03', 'Today'],
    ['2026-07-02', 'Yesterday'],
    ['2026-06-29', '4 days'],
  ])('formats relative visit age for %s', (visitedOn, expected) => {
    expect(relativeVisitAge(visitedOn, '2026-07-03')).toBe(expected)
  })
})

describe('getPharmacyMarkerState', () => {
  const today = '2026-07-03'

  it('uses not-stocked before visit recency', () => {
    expect(getPharmacyMarkerState({ isStocked: false, lastVisitedOn: today }, today)).toBe('not-stocked')
  })

  it('uses default when stocked and never visited', () => {
    expect(getPharmacyMarkerState({ isStocked: true, lastVisitedOn: null }, today)).toBe('default')
  })

  it.each([
    ['2026-07-03', 'visited-hot'],
    ['2026-06-30', 'visited-hot'],
    ['2026-06-29', 'visited-warm'],
    ['2026-06-19', 'visited-warm'],
    ['2026-06-18', 'visited-aging'],
    ['2026-06-03', 'visited-aging'],
    ['2026-06-02', 'visited-stale'],
    ['2026-05-27', 'visited-stale'],
    ['2026-05-26', 'default'],
  ])('maps visit date %s to %s', (lastVisitedOn, markerState) => {
    expect(getPharmacyMarkerState({ isStocked: true, lastVisitedOn }, today)).toBe(markerState)
  })
})
