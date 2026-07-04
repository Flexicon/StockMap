export interface Pharmacy {
  id: string
  googlePlaceId: string
  isStocked: boolean
  lastVisitedOn: string | null
  cachedName: string | null
  cachedAddress: string | null
  cachedLat: number | null
  cachedLng: number | null
  cachedOpeningHoursPeriods: OpeningHoursPeriod[] | null
  cachedOpeningHoursWeekdayText: string[] | null
  googleDetailsCachedAt: string | null
  googlePlaceIdRefreshedAt: string | null
  createdAt: string
  updatedAt: string
  recentVisits: PharmacyVisit[]
}

export interface OpeningHoursPeriod {
  open: OpeningHoursPoint
  close: OpeningHoursPoint | null
}

export interface OpeningHoursPoint {
  day: number
  hour: number
  minute: number
}

export interface PharmacyVisit {
  id: string
  visitedOn: string
  createdAt: string
}

export interface PharmacyInput {
  googlePlaceId: string
  cachedName?: string | null
  cachedAddress?: string | null
  cachedLat?: number | null
  cachedLng?: number | null
  cachedOpeningHoursPeriods?: OpeningHoursPeriod[] | null
  cachedOpeningHoursWeekdayText?: string[] | null
}

export type PharmacyEventType = 'visited' | 'marked_stocked' | 'marked_not_stocked'

export type MarkerState
  = | 'default'
    | 'closed'
    | 'not-stocked'
    | 'visited-hot'
    | 'visited-warm'
    | 'visited-aging'
    | 'visited-stale'
