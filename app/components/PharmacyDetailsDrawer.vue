<template>
  <aside
    v-if="pharmacy"
    class="fixed inset-x-3 bottom-3 z-30 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-4 shadow-2xl shadow-teal-950/15 backdrop-blur md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:w-96 md:p-5"
    aria-label="Pharmacy details"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="truncate text-xl font-bold text-[var(--color-ink)]">
          {{ pharmacy.cachedName || 'Pharmacy' }}
        </h1>
        <p
          v-if="pharmacy.cachedAddress"
          class="mt-1 line-clamp-2 text-sm font-medium text-[var(--color-ink-muted)]"
        >
          {{ pharmacy.cachedAddress }}
        </p>
      </div>

      <button
        class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-surface-muted)] text-xl font-bold text-[var(--color-ink)]"
        type="button"
        aria-label="Close details"
        @click="$emit('close')"
      >
        ×
      </button>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <span
        class="rounded-full px-3 py-1.5 text-sm font-bold"
        :class="pharmacy.isStocked ? 'bg-[var(--color-brand-primary-soft)] text-[var(--color-brand-primary-strong)]' : 'bg-neutral-200 text-neutral-600'"
      >
        {{ pharmacy.isStocked ? 'Stocked' : 'Not stocked' }}
      </span>
      <span class="rounded-full bg-[var(--color-brand-cream)] px-3 py-1.5 text-sm font-bold text-[var(--color-ink-muted)]">
        {{ relativeVisitAge(pharmacy.lastVisitedOn) }}
      </span>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-3">
      <button
        class="rounded-2xl bg-[var(--color-brand-primary)] px-4 py-4 text-base font-bold text-teal-950 shadow-sm transition hover:bg-[var(--color-brand-primary-strong)] hover:text-white disabled:opacity-60"
        type="button"
        :disabled="busy"
        @click="$emit('visit', pharmacy)"
      >
        Visit
      </button>
      <button
        class="rounded-2xl bg-[var(--color-brand-lavender)] px-4 py-4 text-base font-bold text-[var(--color-ink)] shadow-sm transition hover:bg-[var(--color-brand-sage)] disabled:opacity-60"
        type="button"
        :disabled="busy"
        @click="$emit('toggle', pharmacy)"
      >
        {{ pharmacy.isStocked ? 'Not stocked' : 'Stocked' }}
      </button>
    </div>

    <div class="mt-4 border-t border-[var(--color-border)] pt-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-muted)]">
            Visits
          </p>
          <ol
            v-if="pharmacy.recentVisits.length"
            class="mt-2 space-y-1.5"
          >
            <li
              v-for="visit in pharmacy.recentVisits"
              :key="visit.id"
              class="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]"
            >
              <span class="h-2 w-2 rounded-full bg-[var(--color-brand-primary)]" />
              <span>{{ visit.visitedOn }}</span>
              <span class="text-[var(--color-ink-muted)]">{{ relativeVisitAge(visit.visitedOn) }}</span>
            </li>
          </ol>
          <p
            v-else
            class="mt-2 text-sm font-semibold text-[var(--color-ink-muted)]"
          >
            No visits
          </p>
        </div>

        <AlertDialogRoot>
          <AlertDialogTrigger
            class="rounded-full px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            type="button"
            :disabled="busy"
          >
            Delete
          </AlertDialogTrigger>

          <AlertDialogPortal>
            <AlertDialogOverlay class="fixed inset-0 z-40 bg-teal-950/20 backdrop-blur-sm" />
            <AlertDialogContent class="fixed left-1/2 top-1/2 z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl">
              <AlertDialogTitle class="text-lg font-bold text-[var(--color-ink)]">
                Delete?
              </AlertDialogTitle>
              <div class="mt-4 flex justify-end gap-2">
                <AlertDialogCancel class="rounded-full bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">
                  No
                </AlertDialogCancel>
                <AlertDialogAction
                  class="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white"
                  @click="deleteNow"
                >
                  Yes
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialogRoot>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'
import type { Pharmacy } from '~~/shared/types/pharmacy'
import { relativeVisitAge } from '~~/shared/utils/date'

const props = defineProps<{
  pharmacy: Pharmacy | null
  busy: boolean
}>()

const emit = defineEmits<{
  close: []
  visit: [pharmacy: Pharmacy]
  toggle: [pharmacy: Pharmacy]
  delete: [pharmacy: Pharmacy]
}>()

function deleteNow() {
  if (!props.pharmacy) return
  emit('delete', props.pharmacy)
}
</script>
