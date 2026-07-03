<template>
  <form
    class="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-2 shadow-xl shadow-teal-950/10 backdrop-blur"
    role="search"
    @submit.prevent
  >
    <label
      class="sr-only"
      for="place-search"
    >Add pharmacy</label>
    <input
      id="place-search"
      ref="inputEl"
      class="h-11 min-w-0 flex-1 bg-transparent px-4 text-base font-semibold text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)] sm:w-80"
      autocomplete="off"
      placeholder="Dodaj aptekę"
      type="search"
    >
  </form>
</template>

<script setup lang="ts">
import type { Pharmacy, PharmacyInput } from '~~/shared/types/pharmacy'
import { loadGoogleMaps } from '../utils/google-maps'

const emit = defineEmits<{
  created: [pharmacy: Pharmacy]
  failed: [message: string]
}>()

const props = defineProps<{
  createPharmacy: (input: PharmacyInput) => Promise<Pharmacy | null>
}>()

const config = useRuntimeConfig()
const inputEl = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  try {
    const maps = await loadGoogleMaps(config.public.googleMapsBrowserKey)
    if (!inputEl.value) return

    const autocomplete = new maps.maps.places.Autocomplete(inputEl.value, {
      componentRestrictions: { country: 'pl' },
      fields: ['place_id', 'name', 'formatted_address', 'geometry'],
      strictBounds: false,
      types: ['establishment'],
    })

    autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace()
      if (!place.place_id) return

      const input = await normalizePlace(place.place_id, place)
      if (!input) return

      const pharmacy = await props.createPharmacy(input)
      if (!pharmacy) return

      inputEl.value!.value = ''
      emit('created', pharmacy)
    })
  }
  catch {
    emit('failed', 'Maps key needed')
  }
})

async function normalizePlace(placeId: string, place: google.maps.places.PlaceResult): Promise<PharmacyInput | null> {
  const location = placeLocation(place)
  if (!location) return fetchPlaceInput(placeId)

  return {
    googlePlaceId: placeId,
    cachedName: optionalString(place.name),
    cachedAddress: optionalString(place.formatted_address),
    cachedLat: location.lat(),
    cachedLng: location.lng(),
  }
}

async function fetchPlaceInput(placeId: string): Promise<PharmacyInput | null> {
  try {
    const response = await $fetch<{ place: PharmacyInput }>('/api/places/details', {
      query: { placeId },
    })

    return response.place
  }
  catch {
    emit('failed', 'Could not add')
    return null
  }
}

function placeLocation(place: google.maps.places.PlaceResult): google.maps.LatLng | null {
  if (!place.geometry?.location) return null

  return place.geometry.location
}

function optionalString(value: string | undefined): string | null {
  if (value === undefined) return null

  return value
}
</script>
