<template>
  <main class="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_var(--color-brand-primary-soft),_transparent_34rem),linear-gradient(135deg,_var(--color-brand-cream),_var(--color-brand-mint)_52%,_#f9f2ff)] text-[var(--color-ink)]">
    <section class="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div class="absolute right-6 top-10 h-28 w-28 rounded-full bg-[var(--color-brand-peach)]/70 blur-2xl" />
      <div class="absolute bottom-10 left-4 h-36 w-36 rounded-full bg-[var(--color-brand-lavender)]/80 blur-3xl" />

      <p class="relative mb-4 w-fit rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-brand-primary-strong)] shadow-sm">
        StockMap
      </p>

      <h1 class="relative max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
        Family pharmacy tracking on a focused local map.
      </h1>

      <p class="relative mt-6 max-w-2xl text-lg leading-8 text-[var(--color-ink-muted)]">
        Phase 0 establishes the Nuxt, Cloudflare Workers, Tailwind, Reka UI,
        and test baseline for the MVP.
      </p>

      <CollapsibleRoot
        v-model:open="showDetails"
        class="relative mt-10 max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-5 shadow-2xl shadow-teal-900/10 backdrop-blur"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-[var(--color-ink)]">
              Bootstrap status
            </h2>
            <p class="text-sm text-[var(--color-ink-muted)]">
              Minimal shell ready for Phase 1 database work.
            </p>
          </div>

          <CollapsibleTrigger class="rounded-full bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-semibold text-teal-950 shadow-sm shadow-teal-900/10 transition hover:bg-[var(--color-brand-primary-strong)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary-strong)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface)]">
            {{ showDetails ? 'Hide details' : 'Show details' }}
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent class="mt-5 border-t border-[var(--color-border)] pt-5 text-sm leading-6 text-[var(--color-ink-muted)]">
          <ul class="space-y-2">
            <li>Local dev: <code class="rounded bg-[var(--color-brand-primary-soft)] px-1.5 py-0.5 text-[var(--color-brand-primary-strong)]">http://&lt;machine-ip&gt;:6277</code></li>
            <li>Production target: <code class="rounded bg-[var(--color-brand-primary-soft)] px-1.5 py-0.5 text-[var(--color-brand-primary-strong)]">https://apteki.nerfthis.xyz</code></li>
            <li>Health endpoint: <code class="rounded bg-[var(--color-brand-primary-soft)] px-1.5 py-0.5 text-[var(--color-brand-primary-strong)]">/api/health</code></li>
          </ul>
        </CollapsibleContent>
      </CollapsibleRoot>
    </section>
  </main>
</template>

<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'

const showDetails = ref(true)
</script>
