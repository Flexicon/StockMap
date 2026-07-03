import { getDb } from '../../utils/d1'
import { validationError } from '../../utils/http'
import { updatePharmacy, updatePharmacySchema } from '../../utils/pharmacies'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing pharmacy id' })

    const input = updatePharmacySchema.parse(await readBody(event))
    const pharmacy = await updatePharmacy(getDb(event), id, input)

    if (!pharmacy) throw createError({ statusCode: 404, statusMessage: 'Pharmacy not found' })

    return { pharmacy }
  }
  catch (error) {
    throw validationError(error)
  }
})
