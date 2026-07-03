import type { Pharmacy, PharmacyInput } from '~~/shared/types/pharmacy'
import { localDateString } from '~~/shared/utils/date'

interface PharmacyListResponse {
  pharmacies: Pharmacy[]
}

interface PharmacyResponse {
  pharmacy: Pharmacy
}

export function usePharmacies() {
  const pharmacies = ref<Pharmacy[]>([])
  const loading = ref(false)
  const mutatingId = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function refresh() {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<PharmacyListResponse>('/api/pharmacies')
      pharmacies.value = response.pharmacies
    }
    catch {
      error.value = 'Could not load'
    }
    finally {
      loading.value = false
    }
  }

  async function create(input: PharmacyInput): Promise<Pharmacy | null> {
    error.value = null

    try {
      const response = await $fetch<PharmacyResponse>('/api/pharmacies', {
        method: 'POST',
        body: input,
      })
      pharmacies.value = [...pharmacies.value, response.pharmacy]

      return response.pharmacy
    }
    catch (createError) {
      error.value = isFetchConflict(createError) ? 'Already added' : 'Could not add'
      return null
    }
  }

  async function visitToday(pharmacy: Pharmacy) {
    const previous = pharmacies.value
    const today = localDateString()
    mutatingId.value = pharmacy.id
    error.value = null
    pharmacies.value = pharmacies.value.map(item => item.id === pharmacy.id ? { ...item, lastVisitedOn: today } : item)

    try {
      const response = await $fetch<PharmacyResponse>(`/api/pharmacies/${pharmacy.id}/visit-today`, { method: 'POST' })
      replacePharmacy(response.pharmacy)
      return response.pharmacy
    }
    catch {
      pharmacies.value = previous
      error.value = 'Could not save'
      return null
    }
    finally {
      mutatingId.value = null
    }
  }

  async function toggleStocked(pharmacy: Pharmacy) {
    const previous = pharmacies.value
    mutatingId.value = pharmacy.id
    error.value = null
    pharmacies.value = pharmacies.value.map(item => item.id === pharmacy.id ? { ...item, isStocked: !item.isStocked } : item)

    try {
      const response = await $fetch<PharmacyResponse>(`/api/pharmacies/${pharmacy.id}/toggle-stocked`, { method: 'POST' })
      replacePharmacy(response.pharmacy)
      return response.pharmacy
    }
    catch {
      pharmacies.value = previous
      error.value = 'Could not save'
      return null
    }
    finally {
      mutatingId.value = null
    }
  }

  async function remove(pharmacy: Pharmacy) {
    const previous = pharmacies.value
    mutatingId.value = pharmacy.id
    error.value = null
    pharmacies.value = pharmacies.value.filter(item => item.id !== pharmacy.id)

    try {
      await $fetch(`/api/pharmacies/${pharmacy.id}`, { method: 'DELETE' })
      return true
    }
    catch {
      pharmacies.value = previous
      error.value = 'Could not delete'
      return false
    }
    finally {
      mutatingId.value = null
    }
  }

  function replacePharmacy(pharmacy: Pharmacy) {
    pharmacies.value = pharmacies.value.map(item => item.id === pharmacy.id ? pharmacy : item)
  }

  return {
    pharmacies,
    loading,
    mutatingId,
    error,
    refresh,
    create,
    visitToday,
    toggleStocked,
    remove,
  }
}

function isFetchConflict(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'statusCode' in error
    && error.statusCode === 409
}
