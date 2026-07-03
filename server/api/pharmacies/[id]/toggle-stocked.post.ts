import { getDb } from '../../../utils/d1'
import { toggleStocked } from '../../../utils/pharmacies'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing pharmacy id' })

  const pharmacy = await toggleStocked(getDb(event), id)
  if (!pharmacy) throw createError({ statusCode: 404, statusMessage: 'Pharmacy not found' })

  return { pharmacy }
})
