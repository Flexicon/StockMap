<template>
  <div class="relative h-full min-h-screen w-full overflow-hidden bg-[var(--color-brand-mint)]">
    <div
      ref="mapEl"
      class="h-full min-h-screen w-full"
    />

    <div
      v-if="loading"
      class="absolute inset-0 grid place-items-center bg-[var(--color-brand-cream)]/75 text-sm font-semibold text-[var(--color-ink-muted)]"
    >
      Map
    </div>

    <div
      v-if="error"
      class="absolute left-1/2 top-1/2 max-w-64 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center font-semibold text-[var(--color-ink)] shadow-xl"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MarkerState, Pharmacy } from '~~/shared/types/pharmacy'
import { getPharmacyMarkerState } from '~~/shared/utils/marker-state'
import { loadGoogleMaps } from '../utils/google-maps'

const POLAND_BOUNDS = {
  north: 55.2,
  south: 49.0,
  west: 14.0,
  east: 24.5,
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit.station',
    stylers: [{ visibility: 'off' }],
  },
]

const props = defineProps<{
  pharmacies: Pharmacy[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [pharmacy: Pharmacy]
}>()

const config = useRuntimeConfig()
const mapEl = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let map: google.maps.Map | null = null
let mapsApi: typeof google | null = null
let markers: google.maps.Marker[] = []
let markerPharmacyIds: string[] = []

onMounted(async () => {
  try {
    mapsApi = await loadGoogleMaps(config.public.googleMapsBrowserKey)
    if (!mapEl.value) return

    map = new mapsApi.maps.Map(mapEl.value, {
      center: defaultCenter(),
      clickableIcons: false,
      fullscreenControl: false,
      mapTypeControl: false,
      restriction: {
        latLngBounds: POLAND_BOUNDS,
        strictBounds: false,
      },
      streetViewControl: false,
      styles: MAP_STYLES,
      zoom: Number(config.public.defaultMapZoom || 13),
    })

    renderMarkers()
  }
  catch {
    error.value = 'Map unavailable'
  }
  finally {
    loading.value = false
  }
})

watch(() => props.pharmacies, renderMarkers, { deep: true })
watch(() => props.selectedId, highlightSelected)

function defaultCenter(): google.maps.LatLngLiteral {
  return {
    lat: Number(config.public.defaultMapLat || 52.2297),
    lng: Number(config.public.defaultMapLng || 21.0122),
  }
}

function renderMarkers() {
  if (!map || !mapsApi) return

  markers.forEach(marker => marker.setMap(null))
  markers = []
  markerPharmacyIds = []

  props.pharmacies.forEach((pharmacy) => {
    if (typeof pharmacy.cachedLat !== 'number' || typeof pharmacy.cachedLng !== 'number') return

    const state = getPharmacyMarkerState(pharmacy)
    const marker = new mapsApi!.maps.Marker({
      icon: markerIcon(state, pharmacy.id === props.selectedId),
      map,
      position: { lat: pharmacy.cachedLat, lng: pharmacy.cachedLng },
      title: pharmacy.cachedName ?? 'Pharmacy',
    })

    marker.addListener('click', () => emit('select', pharmacy))
    markers.push(marker)
    markerPharmacyIds.push(pharmacy.id)
  })

  highlightSelected()
}

function highlightSelected() {
  if (!mapsApi) return

  markerPharmacyIds.forEach((pharmacyId, index) => {
    const pharmacy = props.pharmacies.find(item => item.id === pharmacyId)
    const marker = markers[index]
    if (!marker || !pharmacy) return

    marker.setIcon(markerIcon(getPharmacyMarkerState(pharmacy), pharmacy.id === props.selectedId))
  })
}

function markerIcon(state: MarkerState, selected: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: markerColor(state),
    fillOpacity: 1,
    scale: selected ? 13 : 10,
    strokeColor: selected ? '#173b3a' : '#ffffff',
    strokeOpacity: 1,
    strokeWeight: selected ? 4 : 3,
  }
}

function markerColor(state: MarkerState): string {
  const colors: Record<MarkerState, string> = {
    'default': '#5ecfc3',
    'not-stocked': '#a6adad',
    'visited-hot': '#d94f45',
    'visited-warm': '#f47a45',
    'visited-aging': '#d8c94a',
    'visited-stale': '#7fbd6a',
  }

  return colors[state]
}
</script>
