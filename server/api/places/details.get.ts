import { z } from 'zod'
import type { PharmacyInput } from '~~/shared/types/pharmacy'
import { getGoogleMapsServerKey } from '../../utils/d1'
import { validationError } from '../../utils/http'

const querySchema = z.object({
  placeId: z.string().min(1),
})

const googlePlaceDetailsSchema = z.object({
  error_message: z.string().optional(),
  result: z.object({
    formatted_address: z.string().optional(),
    geometry: z.object({
      location: z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
      }).optional(),
    }).optional(),
    name: z.string().optional(),
    opening_hours: z.object({
      periods: z.array(z.object({
        open: z.object({
          day: z.number(),
          time: z.string(),
        }),
        close: z.object({
          day: z.number(),
          time: z.string(),
        }).optional(),
      })).optional(),
      weekday_text: z.array(z.string()).optional(),
    }).optional(),
    place_id: z.string().optional(),
  }).optional(),
  status: z.string(),
})

type GooglePlaceDetails = z.infer<typeof googlePlaceDetailsSchema>
type GooglePlaceResult = NonNullable<GooglePlaceDetails['result']> & { place_id: string }
type GoogleOpeningHours = NonNullable<GooglePlaceResult['opening_hours']>

export default defineEventHandler(async (event) => {
  try {
    const { placeId } = querySchema.parse(getQuery(event))
    const key = getGoogleMapsServerKey(event)
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')

    url.searchParams.set('place_id', placeId)
    url.searchParams.set('fields', 'place_id,name,formatted_address,geometry,opening_hours')
    url.searchParams.set('key', key)

    const response = await fetch(url)
    if (!response.ok) throw createError({ statusCode: 502, statusMessage: 'Google Places request failed' })

    const body = googlePlaceDetailsSchema.parse(await response.json())

    return {
      place: placeInputFromDetails(body),
    }
  }
  catch (error) {
    throw validationError(error)
  }
})

function placeInputFromDetails(body: GooglePlaceDetails): PharmacyInput {
  assertOkStatus(body)
  const result = requirePlaceResult(body)
  const openingHours = openingHoursInput(result.opening_hours)

  return {
    googlePlaceId: result.place_id,
    cachedName: optionalString(result.name),
    cachedAddress: optionalString(result.formatted_address),
    cachedLat: optionalNumber(locationValue(result, 'lat')),
    cachedLng: optionalNumber(locationValue(result, 'lng')),
    cachedOpeningHoursPeriods: openingHours.periods,
    cachedOpeningHoursWeekdayText: openingHours.weekdayText,
  }
}

function openingHoursInput(openingHours: GoogleOpeningHours | undefined) {
  return {
    periods: openingHours?.periods?.map(period => ({
      open: openingPoint(period.open),
      close: period.close ? openingPoint(period.close) : null,
    })) ?? null,
    weekdayText: openingHours?.weekday_text ?? null,
  }
}

function locationValue(result: GooglePlaceResult, key: 'lat' | 'lng'): number | undefined {
  return result.geometry?.location?.[key]
}

function openingPoint(point: { day: number, time: string }) {
  return {
    day: point.day,
    hour: Number(point.time.slice(0, 2)),
    minute: Number(point.time.slice(2, 4)),
  }
}

function assertOkStatus(body: GooglePlaceDetails) {
  if (body.status === 'OK') return

  throw createError({ statusCode: 502, statusMessage: errorMessage(body) })
}

function requirePlaceResult(body: GooglePlaceDetails): GooglePlaceResult {
  const result = body.result

  if (!result) throw createError({ statusCode: 502, statusMessage: errorMessage(body) })
  if (!result.place_id) throw createError({ statusCode: 502, statusMessage: errorMessage(body) })

  return result as GooglePlaceResult
}

function errorMessage(body: GooglePlaceDetails): string {
  if (body.error_message) return body.error_message

  return 'Google Place not found'
}

function optionalString(value: string | undefined): string | null {
  if (value === undefined) return null

  return value
}

function optionalNumber(value: number | undefined): number | null {
  if (value === undefined) return null

  return value
}
