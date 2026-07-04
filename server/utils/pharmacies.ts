import { z } from 'zod'
import type { OpeningHoursPeriod, Pharmacy, PharmacyEventType, PharmacyVisit } from '../../shared/types/pharmacy'
import { localDateString } from '../../shared/utils/date'
import type { D1DatabaseBinding } from './d1'

interface PharmacyRow {
  id: string
  google_place_id: string
  is_stocked: number
  last_visited_on: string | null
  cached_name: string | null
  cached_address: string | null
  cached_lat: number | null
  cached_lng: number | null
  cached_opening_hours_periods_json: string | null
  cached_opening_hours_weekday_text_json: string | null
  google_details_cached_at: string | null
  google_place_id_refreshed_at: string | null
  created_at: string
  updated_at: string
}

interface PharmacyVisitRow {
  id: string
  pharmacy_id: string
  event_date: string
  created_at: string
}

const RECENT_VISITS_LIMIT = 5

export const createPharmacySchema = z.object({
  googlePlaceId: z.string().min(1),
  cachedName: z.string().trim().min(1).nullable().optional(),
  cachedAddress: z.string().trim().min(1).nullable().optional(),
  cachedLat: z.number().min(-90).max(90).nullable().optional(),
  cachedLng: z.number().min(-180).max(180).nullable().optional(),
  cachedOpeningHoursPeriods: z.array(z.object({
    open: z.object({
      day: z.number().int().min(0).max(6),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
    }),
    close: z.object({
      day: z.number().int().min(0).max(6),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
    }).nullable(),
  })).nullable().optional(),
  cachedOpeningHoursWeekdayText: z.array(z.string().trim().min(1)).nullable().optional(),
})

export const updatePharmacySchema = z.object({
  isStocked: z.boolean().optional(),
  lastVisitedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).refine(value => Object.keys(value).length > 0, 'Expected at least one supported field')

export type CreatePharmacyInput = z.infer<typeof createPharmacySchema>
export type UpdatePharmacyInput = z.infer<typeof updatePharmacySchema>

export function mapPharmacy(row: PharmacyRow): Pharmacy {
  return {
    id: row.id,
    googlePlaceId: row.google_place_id,
    isStocked: row.is_stocked === 1,
    lastVisitedOn: row.last_visited_on,
    cachedName: row.cached_name,
    cachedAddress: row.cached_address,
    cachedLat: row.cached_lat,
    cachedLng: row.cached_lng,
    cachedOpeningHoursPeriods: parseOpeningHoursPeriods(row.cached_opening_hours_periods_json),
    cachedOpeningHoursWeekdayText: parseStringArray(row.cached_opening_hours_weekday_text_json),
    googleDetailsCachedAt: row.google_details_cached_at,
    googlePlaceIdRefreshedAt: row.google_place_id_refreshed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recentVisits: [],
  }
}

export async function listPharmacies(db: D1DatabaseBinding): Promise<Pharmacy[]> {
  const result = await db.prepare(`
    SELECT *
    FROM pharmacies
    ORDER BY cached_name COLLATE NOCASE, created_at DESC
  `).all<PharmacyRow>()

  const pharmacies = (result.results ?? []).map(mapPharmacy)
  if (pharmacies.length === 0) return pharmacies

  return withRecentVisits(db, pharmacies)
}

export async function getPharmacyById(db: D1DatabaseBinding, id: string): Promise<Pharmacy | null> {
  const row = await db.prepare('SELECT * FROM pharmacies WHERE id = ?').bind(id).first<PharmacyRow>()

  if (!row) return null

  const [pharmacy] = await withRecentVisits(db, [mapPharmacy(row)])

  return pharmacy ?? null
}

async function withRecentVisits(db: D1DatabaseBinding, pharmacies: Pharmacy[]): Promise<Pharmacy[]> {
  const ids = pharmacies.map(pharmacy => pharmacy.id)
  const placeholders = ids.map(() => '?').join(', ')
  const result = await db.prepare(`
    SELECT id, pharmacy_id, event_date, created_at
    FROM (
      SELECT
        id,
        pharmacy_id,
        event_date,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY pharmacy_id ORDER BY event_date DESC, created_at DESC) AS visit_rank
      FROM pharmacy_events
      WHERE event_type = 'visited'
        AND pharmacy_id IN (${placeholders})
    )
    WHERE visit_rank <= ?
    ORDER BY pharmacy_id, event_date DESC, created_at DESC
  `).bind(...ids, RECENT_VISITS_LIMIT).all<PharmacyVisitRow>()

  const visitsByPharmacy = new Map<string, PharmacyVisit[]>()
  for (const row of result.results ?? []) {
    const visits = visitsByPharmacy.get(row.pharmacy_id) ?? []
    visits.push({
      id: row.id,
      visitedOn: row.event_date,
      createdAt: row.created_at,
    })
    visitsByPharmacy.set(row.pharmacy_id, visits)
  }

  return pharmacies.map(pharmacy => ({
    ...pharmacy,
    recentVisits: visitsByPharmacy.get(pharmacy.id) ?? [],
  }))
}

export async function createPharmacy(db: D1DatabaseBinding, input: CreatePharmacyInput): Promise<Pharmacy> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.prepare(`
    INSERT INTO pharmacies (
      id,
      google_place_id,
      cached_name,
      cached_address,
      cached_lat,
      cached_lng,
      cached_opening_hours_periods_json,
      cached_opening_hours_weekday_text_json,
      google_details_cached_at,
      google_place_id_refreshed_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    input.googlePlaceId,
    nullable(input.cachedName),
    nullable(input.cachedAddress),
    nullable(input.cachedLat),
    nullable(input.cachedLng),
    nullableJson(input.cachedOpeningHoursPeriods),
    nullableJson(input.cachedOpeningHoursWeekdayText),
    now,
    now,
    now,
  ).run()

  const pharmacy = await getPharmacyById(db, id)
  if (!pharmacy) throw new Error('Created pharmacy was not found')

  return pharmacy
}

export async function updatePharmacy(db: D1DatabaseBinding, id: string, input: UpdatePharmacyInput): Promise<Pharmacy | null> {
  const current = await getPharmacyById(db, id)
  if (!current) return null

  await db.prepare(`
    UPDATE pharmacies
    SET is_stocked = ?, last_visited_on = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    stockedFlag(resolveStocked(current, input)),
    resolveLastVisitedOn(current, input),
    new Date().toISOString(),
    id,
  ).run()

  return getPharmacyById(db, id)
}

export async function updatePharmacyGoogleCache(db: D1DatabaseBinding, id: string, input: CreatePharmacyInput): Promise<Pharmacy | null> {
  const current = await getPharmacyById(db, id)
  if (!current) return null

  const now = new Date().toISOString()

  await db.prepare(`
    UPDATE pharmacies
    SET
      cached_name = ?,
      cached_address = ?,
      cached_lat = ?,
      cached_lng = ?,
      cached_opening_hours_periods_json = ?,
      cached_opening_hours_weekday_text_json = ?,
      google_details_cached_at = ?,
      google_place_id_refreshed_at = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    nullable(input.cachedName),
    nullable(input.cachedAddress),
    nullable(input.cachedLat),
    nullable(input.cachedLng),
    nullableJson(input.cachedOpeningHoursPeriods),
    nullableJson(input.cachedOpeningHoursWeekdayText),
    now,
    now,
    now,
    id,
  ).run()

  return getPharmacyById(db, id)
}

export async function deletePharmacy(db: D1DatabaseBinding, id: string): Promise<boolean> {
  const existing = await getPharmacyById(db, id)
  if (!existing) return false

  await db.prepare('DELETE FROM pharmacy_events WHERE pharmacy_id = ?').bind(id).run()
  await db.prepare('DELETE FROM pharmacies WHERE id = ?').bind(id).run()

  return true
}

export async function markVisitedToday(db: D1DatabaseBinding, id: string): Promise<Pharmacy | null> {
  const today = localDateString()
  const existing = await getPharmacyById(db, id)
  if (!existing) return null

  await db.batch([
    db.prepare('UPDATE pharmacies SET last_visited_on = ?, updated_at = ? WHERE id = ?').bind(today, new Date().toISOString(), id),
    eventStatement(db, id, 'visited', today),
  ])

  return getPharmacyById(db, id)
}

export async function toggleStocked(db: D1DatabaseBinding, id: string): Promise<Pharmacy | null> {
  const existing = await getPharmacyById(db, id)
  if (!existing) return null

  const nextStocked = !existing.isStocked
  const today = localDateString()

  await db.batch([
    db.prepare('UPDATE pharmacies SET is_stocked = ?, updated_at = ? WHERE id = ?').bind(stockedFlag(nextStocked), new Date().toISOString(), id),
    eventStatement(db, id, stockedEventType(nextStocked), today),
  ])

  return getPharmacyById(db, id)
}

function eventStatement(db: D1DatabaseBinding, pharmacyId: string, eventType: PharmacyEventType, eventDate: string) {
  return db.prepare(`
    INSERT INTO pharmacy_events (id, pharmacy_id, event_type, event_date)
    VALUES (?, ?, ?, ?)
  `).bind(crypto.randomUUID(), pharmacyId, eventType, eventDate)
}

function nullable<T>(value: T | null | undefined): T | null {
  if (value === undefined) return null

  return value
}

function nullableJson(value: unknown[] | null | undefined): string | null {
  if (value === undefined || value === null) return null

  return JSON.stringify(value)
}

function parseOpeningHoursPeriods(value: string | null): OpeningHoursPeriod[] | null {
  if (!value) return null

  const json = parseJson(value)
  if (!json) return null

  const parsed = createPharmacySchema.shape.cachedOpeningHoursPeriods.safeParse(json)

  return parsed.success ? parsed.data ?? null : null
}

function parseStringArray(value: string | null): string[] | null {
  if (!value) return null

  const json = parseJson(value)
  if (!json) return null

  const parsed = createPharmacySchema.shape.cachedOpeningHoursWeekdayText.safeParse(json)

  return parsed.success ? parsed.data ?? null : null
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  }
  catch {
    return null
  }
}

function stockedFlag(value: boolean): number {
  return value ? 1 : 0
}

function resolveStocked(current: Pharmacy, input: UpdatePharmacyInput): boolean {
  if (input.isStocked === undefined) return current.isStocked

  return input.isStocked
}

function resolveLastVisitedOn(current: Pharmacy, input: UpdatePharmacyInput): string | null {
  if (input.lastVisitedOn === undefined) return current.lastVisitedOn

  return input.lastVisitedOn
}

function stockedEventType(isStocked: boolean): PharmacyEventType {
  return isStocked ? 'marked_stocked' : 'marked_not_stocked'
}
