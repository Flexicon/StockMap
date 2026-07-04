import { describe, expect, it } from 'vitest'
import { daysBetweenLocalDates, localDateString, relativeVisitAge } from '../shared/utils/date'
import { getPharmacyMarkerState } from '../shared/utils/marker-state'
import { isPharmacyOpenNow } from '../shared/utils/opening-hours'

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
  const openNow = new Date(2026, 6, 3, 10, 0)
  const closedPeriods = [{
    open: { day: 5, hour: 8, minute: 0 },
    close: { day: 5, hour: 9, minute: 0 },
  }]

  it('uses not-stocked before visit recency', () => {
    expect(getPharmacyMarkerState({ cachedOpeningHoursPeriods: null, isStocked: false, lastVisitedOn: today }, today)).toBe('not-stocked')
  })

  it('uses default when stocked and never visited', () => {
    expect(getPharmacyMarkerState({ cachedOpeningHoursPeriods: null, isStocked: true, lastVisitedOn: null }, today)).toBe('default')
  })

  it('uses closed before visit recency when hours say the pharmacy is closed', () => {
    expect(getPharmacyMarkerState({ cachedOpeningHoursPeriods: closedPeriods, isStocked: true, lastVisitedOn: today }, today, openNow)).toBe('closed')
  })

  it('keeps closed not-stocked pharmacies grey', () => {
    expect(getPharmacyMarkerState({ cachedOpeningHoursPeriods: closedPeriods, isStocked: false, lastVisitedOn: today }, today, openNow)).toBe('not-stocked-closed')
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
    expect(getPharmacyMarkerState({ cachedOpeningHoursPeriods: null, isStocked: true, lastVisitedOn }, today)).toBe(markerState)
  })
})

describe('isPharmacyOpenNow', () => {
  it('returns null when no cached hours exist', () => {
    expect(isPharmacyOpenNow({ cachedOpeningHoursPeriods: null })).toBeNull()
  })

  it('detects an open same-day period', () => {
    expect(isPharmacyOpenNow({
      cachedOpeningHoursPeriods: [{
        open: { day: 5, hour: 8, minute: 0 },
        close: { day: 5, hour: 18, minute: 0 },
      }],
    }, new Date(2026, 6, 3, 10, 0))).toBe(true)
  })

  it('detects a closed same-day period', () => {
    expect(isPharmacyOpenNow({
      cachedOpeningHoursPeriods: [{
        open: { day: 5, hour: 8, minute: 0 },
        close: { day: 5, hour: 18, minute: 0 },
      }],
    }, new Date(2026, 6, 3, 19, 0))).toBe(false)
  })

  it('detects an overnight period crossing midnight', () => {
    expect(isPharmacyOpenNow({
      cachedOpeningHoursPeriods: [{
        open: { day: 5, hour: 22, minute: 0 },
        close: { day: 6, hour: 2, minute: 0 },
      }],
    }, new Date(2026, 6, 4, 1, 0))).toBe(true)
  })
})
