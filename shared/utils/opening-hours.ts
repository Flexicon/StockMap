import type { OpeningHoursPeriod, Pharmacy } from '../types/pharmacy'

const MINUTES_PER_DAY = 24 * 60
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0]

export interface OpeningHoursRow {
  day: string
  time: string
}

export function isPharmacyOpenNow(
  pharmacy: Pick<Pharmacy, 'cachedOpeningHoursPeriods'>,
  now = new Date(),
): boolean | null {
  const periods = pharmacy.cachedOpeningHoursPeriods
  if (!periods?.length) return null

  const minuteOfWeek = now.getDay() * MINUTES_PER_DAY + now.getHours() * 60 + now.getMinutes()

  for (const period of periods) {
    if (!period.close) return true

    const openMinute = pointMinuteOfWeek(period.open)
    let closeMinute = pointMinuteOfWeek(period.close)
    if (closeMinute <= openMinute) closeMinute += MINUTES_PER_WEEK

    if (isWithinPeriod(minuteOfWeek, openMinute, closeMinute)) return true
    if (isWithinPeriod(minuteOfWeek + MINUTES_PER_WEEK, openMinute, closeMinute)) return true
  }

  return false
}

export function formatOpeningHoursRows(
  periods: OpeningHoursPeriod[] | null,
  weekdayText: string[] | null,
): OpeningHoursRow[] {
  if (!periods?.length) return weekdayText?.map(formatWeekdayTextLine) ?? []
  if (periods.some(period => period.close === null)) return DISPLAY_DAYS.map(day => ({ day: weekdayName(day), time: 'Open 24h' }))

  return DISPLAY_DAYS.map((day) => {
    const ranges = periods
      .filter(period => period.open.day === day)
      .map(formatPeriod)

    return {
      day: weekdayName(day),
      time: ranges.length ? ranges.join(', ') : 'Closed',
    }
  })
}

function weekdayName(day: number): string {
  return WEEKDAYS[day] ?? ''
}

function formatWeekdayTextLine(line: string): OpeningHoursRow {
  const separatorIndex = line.indexOf(':')
  if (separatorIndex === -1) return { day: abbreviateWeekday(line), time: '' }

  return {
    day: abbreviateWeekday(line.slice(0, separatorIndex)),
    time: line.slice(separatorIndex + 1).trim(),
  }
}

function formatPeriod(period: OpeningHoursPeriod): string {
  if (!period.close) return 'Open 24h'

  return `${formatTime(period.open)}-${formatTime(period.close)}`
}

function formatTime(point: OpeningHoursPeriod['open']): string {
  return `${padTime(point.hour)}:${padTime(point.minute)}`
}

function padTime(value: number): string {
  return value.toString().padStart(2, '0')
}

function abbreviateWeekday(line: string): string {
  return line
    .replace(/^Monday\b/, 'Mon')
    .replace(/^Tuesday\b/, 'Tue')
    .replace(/^Wednesday\b/, 'Wed')
    .replace(/^Thursday\b/, 'Thu')
    .replace(/^Friday\b/, 'Fri')
    .replace(/^Saturday\b/, 'Sat')
    .replace(/^Sunday\b/, 'Sun')
}

function pointMinuteOfWeek(point: OpeningHoursPeriod['open']): number {
  return point.day * MINUTES_PER_DAY + point.hour * 60 + point.minute
}

function isWithinPeriod(minuteOfWeek: number, openMinute: number, closeMinute: number): boolean {
  return minuteOfWeek >= openMinute && minuteOfWeek < closeMinute
}
