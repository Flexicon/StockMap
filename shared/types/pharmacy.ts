export interface Pharmacy {
  id: string
  googlePlaceId: string
  isStocked: boolean
  lastVisitedOn: string | null
  cachedName: string | null
  cachedAddress: string | null
  cachedLat: number | null
  cachedLng: number | null
  googleDetailsCachedAt: string | null
  googlePlaceIdRefreshedAt: string | null
  createdAt: string
  updatedAt: string
  recentVisits: PharmacyVisit[]
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
}

export type PharmacyEventType = 'visited' | 'marked_stocked' | 'marked_not_stocked'

export type MarkerState
  = | 'default'
    | 'not-stocked'
    | 'visited-hot'
    | 'visited-warm'
    | 'visited-aging'
    | 'visited-stale'
