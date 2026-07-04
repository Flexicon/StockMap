# AGENTS.md

## Project Summary

StockMap is a shipped internal family app for tracking local pharmacies on a Google Map.

Production URL: `https://apteki.nerfthis.xyz`.

Cloudflare Access protects the app externally. Do not add application-level auth, user accounts, roles, sessions, OAuth, or password login.

The app lets family members:

- View tracked pharmacies on a Google Map.
- Add pharmacies through Google Places autocomplete.
- Open a compact pharmacy details drawer.
- Mark a pharmacy as visited today.
- Toggle whether a pharmacy is stocked for the family’s usual prescription needs.
- Hard-delete tracked pharmacies.

The app tracks only pharmacies explicitly added by users. It does not automatically import pharmacies from the map viewport.

## Current Stack

- Nuxt 4 and TypeScript.
- Cloudflare Workers deployment target.
- Cloudflare D1 persistence.
- Google Maps JavaScript API and Google Places.
- Tailwind CSS.
- Reka UI for the delete confirmation dialog.
- Raw SQL server helpers with Zod validation.
- Vitest for focused logic tests.

## Current Code Shape

- `app/app.vue` wires together map, search, selected pharmacy state, and optimistic mutations.
- `app/components/PharmacyMap.vue` owns Google Map initialization and marker rendering.
- `app/components/AddPharmacySearch.vue` owns Places autocomplete and Place normalization.
- `app/components/PharmacyDetailsDrawer.vue` owns the selected pharmacy panel and delete dialog.
- `app/composables/usePharmacies.ts` owns API calls and optimistic list updates.
- `server/api/pharmacies/**` contains Nuxt server routes for tracked pharmacy CRUD and actions.
- `server/api/places/details.get.ts` fetches minimal Google Place details.
- `server/utils/pharmacies.ts` contains D1 queries, validation schemas, and row mapping.
- `shared/utils/date.ts` and `shared/utils/marker-state.ts` contain pure tested business logic.
- `migrations/0001_create_pharmacies.sql` defines `pharmacies` and `pharmacy_events`.

## Local Development

Use `npm run dev` for local Nuxt development.

The dev server is configured for `0.0.0.0:6277`, so it can be reached from other devices on the LAN at `http://<machine-ip>:6277`.

Use Node `24.18.0` as declared in `mise.toml`.

Run checks with:

```sh
npm run check
```

Run tests only with:

```sh
npm run test
```

## Configuration

Required environment variables:

```env
NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
GOOGLE_MAPS_SERVER_KEY=
DEFAULT_MAP_LAT=
DEFAULT_MAP_LNG=
DEFAULT_MAP_ZOOM=14
```

`NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` powers the browser map and Places autocomplete. `GOOGLE_MAPS_SERVER_KEY` powers the server-side Place details fallback.

D1 migration scripts in `package.json` assume the D1 database name is `stockmap`.

## Domain Language

Use **stocked** for the internal availability concept.

- `is_stocked = true`: the pharmacy is currently believed to carry the family’s usual prescriptions/items.
- `is_stocked = false`: the pharmacy is currently believed not to carry those items.

This is app-owned state. It is not Google business status, opening hours, or proof the pharmacy exists.

Preferred UI labels:

- `Stocked`
- `Not stocked`
- `Mark as stocked`
- `Mark as not stocked`

Avoid ambiguous labels like `available` or `unavailable` for this concept.

## Design Direction

Keep visible copy sparse. Prefer a direct, calm, tactile interface over dashboard density.

Prefer:

- Map-first layout.
- Short nouns and verbs.
- Icons, color, position, and simple controls over explanatory text.
- Soft surfaces, rounded controls, generous tap targets, and clear affordances.
- Accessible names and ARIA labels even when visible copy is short.

Avoid:

- Marketing copy inside the app.
- Verbose helper text and empty-state paragraphs.
- Marker legends unless real use shows the colors are unclear.
- Generic SaaS dashboard chrome.
- Dark terminal, cyberpunk, or admin-console styling.

## Map And Places Rules

- Use Google Maps for rendering the map.
- Use Google Places only to add/import pharmacies to the tracked list.
- Do not auto-fetch pharmacies when the user pans or zooms.
- The canonical external identifier is `google_place_id`.
- Cached Google fields such as name, address, lat, and lng are display/cache data, not app-owned truth.

When adding a pharmacy:

1. The user searches with Places autocomplete.
2. The user selects a pharmacy result.
3. The app normalizes the Google Place details.
4. The app creates a tracked pharmacy in D1.
5. Duplicate `google_place_id` values are rejected cleanly.

## Data Model

Persist app-owned state in D1:

- `google_place_id`
- `is_stocked`
- `last_visited_on`
- `pharmacy_events`
- timestamps

Visits use calendar dates, stored as `YYYY-MM-DD`. Treat “today” according to the user/app local timezone and avoid UTC rollover bugs.

Deletes are hard deletes. The API explicitly deletes child events before deleting the pharmacy.

## Testing Guidance

Favor tests for pure logic and server helpers:

- Date helpers and marker state buckets.
- Stocked/not-stocked precedence.
- Zod validation schemas.
- D1 row mapping.
- Duplicate-place error handling.
- Cloudflare binding fallback behavior.
- Optimistic update rollback logic if `usePharmacies` changes substantially.

Avoid brittle browser automation around Google Maps unless there is a specific regression that cannot be covered lower in the stack.

## Implementation Style

Keep the app small and explicit.

Prefer boring code over abstractions. Do not create generic repositories, service layers, stores, or design-system components unless they reduce real duplication.

Use strong TypeScript types for pharmacy data and API responses. Keep response shapes explicit.

Preserve the no-auth, private-family-app scope unless the user explicitly asks for a product direction change.
