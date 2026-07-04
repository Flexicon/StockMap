<template>
  <form
    ref="formEl"
    class="add-pharmacy-search flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-2 shadow-xl shadow-teal-950/10 backdrop-blur"
    role="search"
    @submit.prevent
  />
</template>

<script setup lang="ts">
import type { Pharmacy, PharmacyInput } from '~~/shared/types/pharmacy'
import { loadGoogleMaps } from '../utils/google-maps'

const emit = defineEmits<{
  created: [pharmacy: Pharmacy]
  failed: [message: string]
  selected: [pharmacy: Pharmacy]
}>()

const props = defineProps<{
  createPharmacy: (input: PharmacyInput) => Promise<Pharmacy | null>
  map: google.maps.Map | null
  pharmacies: Pharmacy[]
}>()

const config = useRuntimeConfig()
const formEl = ref<HTMLFormElement | null>(null)
let autocomplete: google.maps.places.PlaceAutocompleteElement | null = null
let mapBoundsListener: google.maps.MapsEventListener | null = null

onMounted(async () => {
  try {
    const maps = await loadGoogleMaps(config.public.googleMapsBrowserKey)
    if (!formEl.value) return

    autocomplete = new maps.places.PlaceAutocompleteElement({
      includedPrimaryTypes: ['pharmacy'],
      includedRegionCodes: ['pl'],
      placeholder: 'Dodaj aptekę',
    })
    autocomplete.className = 'block h-11 min-w-0 flex-1 text-base font-semibold sm:w-80'
    autocomplete.setAttribute('aria-label', 'Add pharmacy')
    autocomplete.setAttribute('no-clear-button', '')
    autocomplete.setAttribute('no-input-icon', '')
    formEl.value.append(autocomplete)
    bindAutocompleteToMap()

    autocomplete.addEventListener('gmp-select', async (event) => {
      const place = (event as google.maps.places.PlacePredictionSelectEvent).placePrediction.toPlace()
      await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location'] })
      if (!place.id) return

      const input = await normalizePlace(place)
      if (!input) return

      const existing = props.pharmacies.find(pharmacy => pharmacy.googlePlaceId === input.googlePlaceId)
      if (existing) {
        autocomplete!.value = ''
        emit('selected', existing)
        return
      }

      const pharmacy = await props.createPharmacy(input)
      if (!pharmacy) return

      autocomplete!.value = ''
      emit('created', pharmacy)
    })
  }
  catch {
    emit('failed', 'Maps key needed')
  }
})

watch(() => props.map, bindAutocompleteToMap)

onBeforeUnmount(() => {
  mapBoundsListener?.remove()
})

function bindAutocompleteToMap() {
  if (!autocomplete || !props.map) return

  mapBoundsListener?.remove()
  autocomplete.locationBias = props.map.getBounds() ?? null
  mapBoundsListener = props.map.addListener('bounds_changed', () => {
    autocomplete!.locationBias = props.map!.getBounds() ?? null
  })
}

async function normalizePlace(place: google.maps.places.Place): Promise<PharmacyInput | null> {
  const location = placeLocation(place)
  if (!location) return fetchPlaceInput(place.id)

  return {
    googlePlaceId: place.id,
    cachedName: optionalString(place.displayName ?? undefined),
    cachedAddress: optionalString(place.formattedAddress ?? undefined),
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

function placeLocation(place: google.maps.places.Place): google.maps.LatLng | null {
  if (!place.location) return null

  return place.location
}

function optionalString(value: string | undefined): string | null {
  if (value === undefined) return null

  return value
}
</script>

<style scoped>
.add-pharmacy-search :deep(gmp-place-autocomplete) {
  background-color: transparent;
  border: 0;
  border-radius: 9999px;
  color: var(--color-ink);
  color-scheme: light;
  font: inherit;
}

.add-pharmacy-search :deep(gmp-place-autocomplete::part(input)) {
  color: var(--color-ink);
  font: inherit;
  font-weight: 700;
}

.add-pharmacy-search :deep(gmp-place-autocomplete::part(focus-ring)) {
  border: 0;
  box-shadow: none;
}

.add-pharmacy-search :deep(gmp-place-autocomplete::part(prediction-list)) {
  margin-top: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  background: var(--color-surface);
  box-shadow: 0 1.25rem 2.5rem rgb(19 78 74 / 18%);
}

.add-pharmacy-search :deep(gmp-place-autocomplete::part(prediction-item)) {
  background: var(--color-surface);
  color: var(--color-ink);
}

.add-pharmacy-search :deep(gmp-place-autocomplete::part(prediction-item):hover) {
  background: var(--color-brand-mint);
}

.add-pharmacy-search :deep(gmp-place-autocomplete::part(prediction-item-selected)) {
  background: var(--color-brand-primary-soft);
}

.add-pharmacy-search :deep(gmp-place-autocomplete::part(prediction-item-icon)) {
  color: var(--color-brand-primary-strong);
}

.add-pharmacy-search :deep(gmp-place-autocomplete::part(prediction-item-main-text)),
.add-pharmacy-search :deep(gmp-place-autocomplete::part(prediction-item-match)) {
  color: var(--color-ink);
  font-weight: 800;
}

.add-pharmacy-search :deep(gmp-place-autocomplete::part(prediction-item-nonmatch)),
.add-pharmacy-search :deep(gmp-place-autocomplete::part(prediction-item-secondary-text)) {
  color: var(--color-ink-muted);
}
</style>
