import { z } from 'zod'
import { getGoogleMapsServerKey } from '../../utils/d1'
import { fetchGooglePlaceInput } from '../../utils/google-places'
import { validationError } from '../../utils/http'

const querySchema = z.object({
  placeId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  try {
    const { placeId } = querySchema.parse(getQuery(event))

    return {
      place: await fetchGooglePlaceInput(placeId, getGoogleMapsServerKey(event)),
    }
  }
  catch (error) {
    throw validationError(error)
  }
})
