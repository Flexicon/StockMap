import { getDb } from '../../utils/d1'
import { isDuplicatePlaceError, validationError } from '../../utils/http'
import { createPharmacy, createPharmacySchema } from '../../utils/pharmacies'

export default defineEventHandler(async (event) => {
  try {
    const input = createPharmacySchema.parse(await readBody(event))
    const pharmacy = await createPharmacy(getDb(event), input)

    setResponseStatus(event, 201)
    return { pharmacy }
  }
  catch (error) {
    if (isDuplicatePlaceError(error)) {
      throw createError({ statusCode: 409, statusMessage: 'Pharmacy already tracked' })
    }

    throw validationError(error)
  }
})
