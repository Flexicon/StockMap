<template>
  <main class="relative min-h-screen overflow-hidden text-[var(--color-ink)]">
    <ClientOnly>
      <PharmacyMap
        :pharmacies="pharmacies"
        :selected-id="selectedId"
        @ready="map = $event"
        @select="selectPharmacy"
      />

      <template #fallback>
        <div class="min-h-screen bg-[var(--color-brand-cream)] font-bold text-[var(--color-ink-muted)]" />
      </template>
    </ClientOnly>

    <div class="pointer-events-none fixed inset-x-3 top-3 z-20 flex flex-col gap-3 sm:left-4 sm:right-auto sm:top-4">
      <div class="pointer-events-auto">
        <AddPharmacySearch
          :create-pharmacy="create"
          :map="map"
          @created="selectPharmacy"
          @failed="setError"
        />
      </div>
    </div>

    <div
      v-if="loading"
      class="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[var(--color-surface)] px-4 py-2 text-sm font-bold text-[var(--color-ink-muted)] shadow-lg"
    >
      Loading
    </div>

    <div
      v-if="error"
      class="fixed left-1/2 top-24 z-40 -translate-x-1/2 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700 shadow-lg"
    >
      {{ error }}
    </div>

    <PharmacyDetailsDrawer
      :busy="Boolean(selectedPharmacy && mutatingId === selectedPharmacy.id)"
      :pharmacy="selectedPharmacy"
      @close="selectedId = null"
      @delete="deleteSelected"
      @toggle="toggleSelected"
      @visit="visitSelected"
    />
  </main>
</template>

<script setup lang="ts">
import type { Pharmacy } from '~~/shared/types/pharmacy'

const {
  pharmacies,
  loading,
  mutatingId,
  error,
  refresh,
  create,
  visitToday,
  toggleStocked,
  remove,
} = usePharmacies()

const selectedId = ref<string | null>(null)
const map = shallowRef<google.maps.Map | null>(null)
const selectedPharmacy = computed(() => pharmacies.value.find(pharmacy => pharmacy.id === selectedId.value) ?? null)

onMounted(refresh)

function selectPharmacy(pharmacy: Pharmacy) {
  selectedId.value = pharmacy.id
}

function setError(message: string) {
  error.value = message
}

async function visitSelected(pharmacy: Pharmacy) {
  const updated = await visitToday(pharmacy)
  if (updated) selectedId.value = updated.id
}

async function toggleSelected(pharmacy: Pharmacy) {
  const updated = await toggleStocked(pharmacy)
  if (updated) selectedId.value = updated.id
}

async function deleteSelected(pharmacy: Pharmacy) {
  const deleted = await remove(pharmacy)
  if (deleted) selectedId.value = null
}
</script>
