import { describe, expect, it } from 'vitest'
import { daysBetweenLocalDates, localDateString, relativeVisitAge } from '../shared/utils/date'
import { getPharmacyMarkerState } from '../shared/utils/marker-state'
import { formatOpeningHoursRows, isPharmacyOpenNow } from '../shared/utils/opening-hours'

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
    expect(getPharmacyMarkerState({ cachedOpeningHoursPeriods: closedPeriods, isStocked: false, lastVisitedOn: today }, today, openNow)).toBe('closed')
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

describe('formatOpeningHoursRows', () => {
  it('formats structured periods as 24-hour weekday rows', () => {
    expect(formatOpeningHoursRows([{
      open: { day: 1, hour: 8, minute: 0 },
      close: { day: 1, hour: 18, minute: 30 },
    }], null)).toEqual([
      { day: 'Mon', time: '08:00-18:30' },
      { day: 'Tue', time: 'Closed' },
      { day: 'Wed', time: 'Closed' },
      { day: 'Thu', time: 'Closed' },
      { day: 'Fri', time: 'Closed' },
      { day: 'Sat', time: 'Closed' },
      { day: 'Sun', time: 'Closed' },
    ])
  })

  it('joins multiple ranges on the same day', () => {
    expect(formatOpeningHoursRows([
      { open: { day: 2, hour: 8, minute: 0 }, close: { day: 2, hour: 12, minute: 0 } },
      { open: { day: 2, hour: 14, minute: 15 }, close: { day: 2, hour: 18, minute: 45 } },
    ], null)[1]).toEqual({ day: 'Tue', time: '08:00-12:00, 14:15-18:45' })
  })

  it('formats overnight ranges using 24-hour times', () => {
    expect(formatOpeningHoursRows([{
      open: { day: 5, hour: 22, minute: 0 },
      close: { day: 6, hour: 2, minute: 0 },
    }], null)[4]).toEqual({ day: 'Fri', time: '22:00-02:00' })
  })

  it('falls back to cached Google weekday text when structured periods are missing', () => {
    expect(formatOpeningHoursRows(null, ['Monday: 8:00 AM - 6:30 PM'])).toEqual([
      { day: 'Mon', time: '8:00 AM - 6:30 PM' },
    ])
  })
})
