<template>
  <main class="min-h-screen bg-slate-950 text-white">
    <section class="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p class="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
        StockMap
      </p>

      <h1 class="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
        Family pharmacy tracking on a focused local map.
      </h1>

      <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
        Phase 0 establishes the Nuxt, Cloudflare Workers, Tailwind, Reka UI,
        and test baseline for the MVP.
      </p>

      <CollapsibleRoot
        v-model:open="showDetails"
        class="mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-emerald-950/40 backdrop-blur"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold">
              Bootstrap status
            </h2>
            <p class="text-sm text-slate-300">
              Minimal shell ready for Phase 1 database work.
            </p>
          </div>

          <CollapsibleTrigger class="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200">
            {{ showDetails ? 'Hide details' : 'Show details' }}
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent class="mt-5 border-t border-white/10 pt-5 text-sm leading-6 text-slate-300">
          <ul class="space-y-2">
            <li>Local dev: <code class="text-emerald-200">http://&lt;machine-ip&gt;:6277</code></li>
            <li>Production target: <code class="text-emerald-200">https://apteki.nerfthis.xyz</code></li>
            <li>Health endpoint: <code class="text-emerald-200">/api/health</code></li>
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
