import type { MarkerState, Pharmacy } from '../types/pharmacy'
import { daysBetweenLocalDates, localDateString } from './date'

export function getPharmacyMarkerState(
  pharmacy: Pick<Pharmacy, 'isStocked' | 'lastVisitedOn'>,
  today = localDateString(),
): MarkerState {
  if (!pharmacy.isStocked) return 'not-stocked'
  if (!pharmacy.lastVisitedOn) return 'default'

  const days = daysBetweenLocalDates(pharmacy.lastVisitedOn, today)

  if (days <= 3) return 'visited-hot'
  if (days <= 14) return 'visited-warm'
  if (days <= 30) return 'visited-aging'
  if (days <= 37) return 'visited-stale'

  return 'default'
}
