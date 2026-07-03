import { getDb } from '../../utils/d1'
import { listPharmacies } from '../../utils/pharmacies'

export default defineEventHandler(async (event) => {
  const pharmacies = await listPharmacies(getDb(event))

  return { pharmacies }
})
