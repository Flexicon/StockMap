import { getDb } from '../../utils/d1'
import { deletePharmacy } from '../../utils/pharmacies'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing pharmacy id' })

  const deleted = await deletePharmacy(getDb(event), id)
  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Pharmacy not found' })

  return { ok: true }
})
