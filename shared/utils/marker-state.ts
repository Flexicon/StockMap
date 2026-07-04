import type { MarkerState, Pharmacy } from '../types/pharmacy'
import { daysBetweenLocalDates, localDateString } from './date'
import { isPharmacyOpenNow } from './opening-hours'

export function getPharmacyMarkerState(
  pharmacy: Pick<Pharmacy, 'cachedOpeningHoursPeriods' | 'isStocked' | 'lastVisitedOn'>,
  today = localDateString(),
  now = new Date(),
): MarkerState {
  const isOpen = isPharmacyOpenNow(pharmacy, now)

  if (isOpen === false && !pharmacy.isStocked) return 'not-stocked-closed'
  if (isOpen === false) return 'closed'
  if (!pharmacy.isStocked) return 'not-stocked'
  if (!pharmacy.lastVisitedOn) return 'default'

  const days = daysBetweenLocalDates(pharmacy.lastVisitedOn, today)

  if (days <= 3) return 'visited-hot'
  if (days <= 14) return 'visited-warm'
  if (days <= 30) return 'visited-aging'
  if (days <= 37) return 'visited-stale'

  return 'default'
}
