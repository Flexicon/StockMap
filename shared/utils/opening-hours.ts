import type { OpeningHoursPeriod, Pharmacy } from '../types/pharmacy'

const MINUTES_PER_DAY = 24 * 60
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY

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

function pointMinuteOfWeek(point: OpeningHoursPeriod['open']): number {
  return point.day * MINUTES_PER_DAY + point.hour * 60 + point.minute
}

function isWithinPeriod(minuteOfWeek: number, openMinute: number, closeMinute: number): boolean {
  return minuteOfWeek >= openMinute && minuteOfWeek < closeMinute
}
