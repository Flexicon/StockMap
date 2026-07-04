import { getDb, getGoogleMapsServerKey } from '../../../utils/d1'
import { fetchGooglePlaceInput } from '../../../utils/google-places'
import { validationError } from '../../../utils/http'
import { getPharmacyById, updatePharmacyGoogleCache } from '../../../utils/pharmacies'
import type { D1DatabaseBinding } from '../../../utils/d1'

export default defineEventHandler(async (event) => {
  try {
    const id = requirePharmacyId(event)
    const db = getDb(event)
    const existing = await requirePharmacy(db, id)

    const place = await fetchGooglePlaceInput(existing.googlePlaceId, getGoogleMapsServerKey(event))

    return { pharmacy: await requireUpdatedPharmacy(db, id, place) }
  }
  catch (error) {
    throw validationError(error)
  }
})

function requirePharmacyId(event: Parameters<typeof getRouterParam>[0]): string {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing pharmacy id' })

  return id
}

async function requirePharmacy(db: D1DatabaseBinding, id: string) {
  const pharmacy = await getPharmacyById(db, id)
  if (!pharmacy) throw createError({ statusCode: 404, statusMessage: 'Pharmacy not found' })

  return pharmacy
}

async function requireUpdatedPharmacy(db: D1DatabaseBinding, id: string, place: Parameters<typeof updatePharmacyGoogleCache>[2]) {
  const pharmacy = await updatePharmacyGoogleCache(db, id, place)
  if (!pharmacy) throw createError({ statusCode: 404, statusMessage: 'Pharmacy not found' })

  return pharmacy
}
