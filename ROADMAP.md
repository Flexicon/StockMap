# ROADMAP.md

## Current State

StockMap is a shipped internal family app for tracking local pharmacies at `https://apteki.nerfthis.xyz`.

The app is a Nuxt 4 application built for Cloudflare Workers. It uses Cloudflare D1 for persistence, Google Maps for the map, Google Places autocomplete for adding pharmacies, Tailwind CSS for styling, Reka UI for the delete confirmation dialog, and Vitest for focused regression tests.

Cloudflare Access protects the production URL at the edge. The app itself intentionally has no login, user accounts, roles, or application-level sessions.

## What Exists

- Full-screen Google Map centered from environment configuration, with approximate Poland bounds.
- Tracked pharmacies rendered as Google Maps advanced markers.
- Google Places autocomplete restricted to pharmacies in Poland for adding tracked pharmacies.
- Pharmacy details drawer with name, address, stocked state, recent visit age, recent visits, visit action, stocked toggle, and delete action.
- Optimistic UI updates for visit, stocked toggle, and delete, with short rollback errors.
- Nuxt server routes for pharmacy list, create, patch, delete, visit-today, stocked toggle, Google Place details lookup, and health.
- D1 migration for `pharmacies` and `pharmacy_events`.
- Raw SQL server helpers with Zod validation.
- Tests for marker/date logic, pharmacy validation/mapping, duplicate-place error detection, and Cloudflare binding helpers.

## Operating Notes

- Production URL: `https://apteki.nerfthis.xyz`.
- Local dev command: `npm run dev`.
- Local dev server: `0.0.0.0:6277`.
- Test command: `npm run test`.
- Full local quality gate: `npm run check`.
- D1 migration commands in `package.json` assume a D1 database named `stockmap`.
- The repository currently does not have a checked-in `wrangler.jsonc`; deployment config may come from generated Nuxt/Nitro output or external Cloudflare configuration.
- README is currently minimal and should be expanded if handoff or repeat deployment instructions are needed.

## Configuration

Required environment variables:

```env
NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
GOOGLE_MAPS_SERVER_KEY=
DEFAULT_MAP_LAT=
DEFAULT_MAP_LNG=
DEFAULT_MAP_ZOOM=14
```

The browser key is used by the Google Maps JavaScript API and Places autocomplete. The server key is used by `/api/places/details` as a fallback when autocomplete does not return coordinates.

## Near-Term Maintenance

- Add a checked-in `wrangler.jsonc` if deployment is expected to be reproducible from a fresh clone.
- Expand README with production deploy, D1 migration, secrets, and Cloudflare Access notes.
- Add tests around `usePharmacies` optimistic rollback behavior if the composable starts changing frequently.
- Consider extracting and testing Google Place normalization if `AddPharmacySearch.vue` grows beyond the current direct flow.
- Keep API response shapes explicit and boring; avoid adding generic service layers unless duplication becomes real.

## Product Boundaries

Keep the app small and family-focused.

Do not add these unless the actual workflow needs them:

- Application-level auth, users, roles, or sessions.
- Multi-tenant SaaS behavior.
- Automatic pharmacy import from map viewport changes.
- Route planning.
- Opening-hours logic.
- Prescription inventory management.
- Push or email notifications.
- Notes or custom aliases.
- City setup/settings UI.
- Import/export.
- Offline mode.
- Analytics dashboards.

## Possible Future Improvements

### City Setup

If configured map defaults become painful, add a small setup/settings flow for choosing the default town through Google Places and persisting it.

### Nearby Discovery

Add a user-triggered discovery mode that searches the visible map area and presents candidate pharmacies separately from tracked pharmacies. Do not auto-persist every result.

### History View

Expose `pharmacy_events` in the UI if visit or stocked-state history becomes useful beyond the recent visits already shown in the drawer.

### Filters

Add lightweight filters only if the marker count gets high enough to require them: stocked, not stocked, recently visited, and needs visit.
