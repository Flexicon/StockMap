# ROADMAP.md

## Goal

Build **StockMap**, an internal family pharmacy tracking app on Nuxt, Cloudflare Workers, Cloudflare D1, and Google Maps.

The intended production URL is `https://apteki.nerfthis.xyz`.

The MVP should let users:

- Open a map centered on a configured town/city in Poland.
- Add pharmacies via Google Places search.
- See tracked pharmacies as map markers.
- Click/tap a pharmacy marker to see details.
- Mark a pharmacy as visited today.
- Toggle whether a pharmacy is stocked for the family’s usual prescription needs.
- Hard-delete pharmacies.

The app is protected by Cloudflare Access. Do not add application-level auth.

Design intent:

- Use as little visible text as possible while keeping the app clear and accessible.
- Favor the calm, plain, tactile product sensibility of 37signals apps such as Campfire, Fizzy, Writebook, and Basecamp.
- Let the map, markers, colors, position, and a few obvious controls carry the interface.
- Prefer short nouns and verbs over explanatory sentences.
- Avoid dark hacker styling, generic SaaS density, marketing copy, and dashboard-like chrome.

## Phase 0 — Project Bootstrap

Create the Nuxt project and baseline Cloudflare setup.

Tasks:

- Scaffold Nuxt 4 with TypeScript.
- Configure deployment to Cloudflare Workers.
- Add Tailwind CSS.
- Add Reka UI.
- Add linting/formatting.
- Add Vitest or the project’s default Nuxt-compatible test setup.
- Add a minimal home page.
- Add a minimal health endpoint.
- Configure local dev to run on port `6277` and bind to the LAN, so it is reachable at `http://<machine-ip>:6277`.
- Add `.env.example` with required variables.

Required env vars:

```env
NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
GOOGLE_MAPS_SERVER_KEY=
DEFAULT_MAP_LAT=
DEFAULT_MAP_LNG=
DEFAULT_MAP_ZOOM=13
```

Acceptance criteria:

- App runs locally.
- App is reachable from other machines on the LAN at `http://<machine-ip>:6277` during development.
- App can be deployed to Cloudflare Workers.
- Tailwind classes work.
- Reka UI components can be imported.
- Health endpoint returns a simple JSON response.

## Phase 1 — D1 Database and Schema

Add Cloudflare D1 persistence.

Tasks:

- Create D1 database binding.
- Add migrations for `pharmacies`.
- Add migrations for `pharmacy_events`.
- Add database client/helper for server routes.
- Decide whether to use Drizzle or raw SQL. Prefer Drizzle unless it slows down setup.

Schema target:

```sql
CREATE TABLE pharmacies (
  id TEXT PRIMARY KEY,
  google_place_id TEXT NOT NULL UNIQUE,
  is_stocked INTEGER NOT NULL DEFAULT 1,
  last_visited_on TEXT,
  cached_name TEXT,
  cached_address TEXT,
  cached_lat REAL,
  cached_lng REAL,
  google_details_cached_at TEXT,
  google_place_id_refreshed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pharmacy_events (
  id TEXT PRIMARY KEY,
  pharmacy_id TEXT NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Acceptance criteria:

- Migrations can be applied locally.
- Migrations can be applied remotely.
- Server code can read/write test data from D1.

## Phase 2 — Pharmacy API

Build the server API for tracked pharmacies.

Tasks:

- Add typed server-side pharmacy model.
- Add input validation.
- Implement `GET /api/pharmacies`.
- Implement `POST /api/pharmacies`.
- Implement `PATCH /api/pharmacies/:id` if needed for internal updates.
- Implement `DELETE /api/pharmacies/:id`.
- Implement `POST /api/pharmacies/:id/visit-today`.
- Implement `POST /api/pharmacies/:id/toggle-stocked`.
- Insert event rows for visit and stocked-state changes.

Event types:

```text
visited
marked_stocked
marked_not_stocked
```

Acceptance criteria:

- Can create a pharmacy with Google Place ID and cached display details.
- Duplicate Google Place IDs are rejected cleanly.
- Can list pharmacies.
- Can hard-delete a pharmacy.
- Can mark a pharmacy as visited today.
- Can toggle stocked/not-stocked state.
- Visit and stocked changes create `pharmacy_events` rows.

## Phase 3 — Pure Business Logic

Implement and test marker state/date logic before wiring up the map.

Tasks:

- Add a pure `getPharmacyMarkerState` function.
- Add date helpers for local `YYYY-MM-DD` dates.
- Add tests for marker precedence and date buckets.

Marker state rules:

```text
not stocked -> grey marker, regardless of last visit date
no visit date -> default marker
0-3 days since visit -> visited-hot
4-14 days -> visited-warm
15-30 days -> visited-aging
31-37 days -> visited-stale
38+ days -> default marker
```

Acceptance criteria:

- Tests cover stocked/not-stocked precedence.
- Tests cover missing visit dates.
- Tests cover all date bucket boundaries.
- Date logic does not rely on UTC midnight in a way that breaks local “today”.

## Phase 4 — Map Shell

Render the main map UI.

Tasks:

- Add Google Maps JavaScript loader.
- Render a full-screen map.
- Center map using `DEFAULT_MAP_LAT`, `DEFAULT_MAP_LNG`, and `DEFAULT_MAP_ZOOM`.
- Add approximate Poland bounds if simple.
- Add loading/error state for map initialization.
- Keep the map pannable and zoomable.
- Keep map chrome sparse; avoid explanatory page copy around the map.

Approximate bounds:

```ts
const POLAND_BOUNDS = {
  north: 55.2,
  south: 49.0,
  west: 14.0,
  east: 24.5,
}
```

Acceptance criteria:

- Map loads locally with configured env vars.
- Map loads after deployment.
- Initial viewport is controlled by env vars.
- User can pan and zoom.
- Poland bounds are applied if this does not cause awkward UX or excessive code.
- The shell feels like a map-first tool, not a dashboard or landing page.

## Phase 5 — Render Tracked Pharmacy Markers

Connect the pharmacy API to the map.

Tasks:

- Fetch tracked pharmacies on page load.
- Render one marker per pharmacy with valid cached lat/lng.
- Apply marker visual state from `getPharmacyMarkerState`.
- Add empty state when no pharmacies exist.
- Refresh markers after API mutations.

Acceptance criteria:

- Existing pharmacies appear as markers.
- Marker state reflects stocked/not-stocked and visit recency.
- Not-stocked markers are visually distinct and greyed out.
- Missing/invalid coordinates are handled safely.

## Phase 6 — Pharmacy Details Drawer

Add marker click/tap interactions.

Tasks:

- Open a details drawer/panel when a marker is selected.
- Show pharmacy name.
- Show address if available.
- Show last visited date.
- Show relative age of last visit.
- Show stocked/not-stocked state.
- Add “Mark visited today” button.
- Add stocked/not-stocked toggle.
- Add delete action.
- Use a side drawer on desktop and bottom sheet on mobile/tablet.
- Keep drawer copy short; use compact state chips, dates, and large actions instead of helper paragraphs.

Acceptance criteria:

- Clicking/tapping a marker opens details.
- Marking visited updates UI and persists to D1.
- Toggling stocked state updates UI and persists to D1.
- Deleting removes the pharmacy from the map and D1.
- Mutations have clear loading/error states.
- The drawer is understandable at a glance with minimal visible text.

## Phase 7 — Add Pharmacy via Google Places

Implement the MVP add flow.

Tasks:

- Add search/autocomplete UI.
- Restrict or bias search toward pharmacies in Poland where practical.
- On selection, resolve Place ID and minimal details.
- Persist new tracked pharmacy.
- Prevent duplicate tracked pharmacies.
- Add marker to map after successful creation.
- Keep the add flow direct: search, choose, done.

Minimum required fields from Google:

```text
place_id
name
formatted address
lat
lng
```

Acceptance criteria:

- User can search for a pharmacy.
- User can select a Google Places result.
- App creates a tracked pharmacy record.
- App stores Google Place ID and cached display fields.
- Duplicate adds are handled cleanly.
- Newly added pharmacy appears on the map immediately.
- The add UI avoids verbose instructions and uses accessible labels for sparse visible copy.

## Phase 8 — UI Polish

Make the app pleasant enough for family use, with minimal copy and a plain 37signals-like tactility.

Tasks:

- Improve mobile/touch layout.
- Add optimistic updates for visit/toggle actions.
- Add small toast/inline errors for failed mutations.
- Add loading skeletons or simple loading states.
- Add marker legend.
- Add confirmation before delete.
- Make map controls usable on iPhone/iPad.
- Reduce visible text where icons, position, color, or state chips are clearer.
- Keep empty, loading, and error states short and direct.

Acceptance criteria:

- App is usable on desktop and mobile.
- Primary actions are one tap/click from the details panel.
- Error states are visible but not noisy.
- Delete requires confirmation.
- The UI feels bright, calm, pharmacy-adjacent, and not dark/hacker-like.
- Visible labels are sparse but accessible names remain complete.

## Phase 9 — Cloudflare Deployment Hardening

Prepare for real use behind Cloudflare Access.

Tasks:

- Use Wrangler CLI as the deployment and D1 operations tool.
- Add or finalize `wrangler.jsonc` for the `StockMap` Worker.
- Configure the production route/custom domain for `https://apteki.nerfthis.xyz`.
- Document Cloudflare Access setup.
- Document required Google Cloud API/key restrictions.
- Document D1 migration commands.
- Document local dev setup.
- Document Wrangler commands for deploy, D1 migrations, secrets, and logs.
- Confirm production env vars/secrets.
- Confirm browser Maps key is restricted by HTTP referrer.
- Confirm server key is stored as a Cloudflare secret.

Acceptance criteria:

- README has exact local setup steps.
- README has exact Wrangler-based deploy steps.
- README explains required Cloudflare Access policy.
- App works behind Cloudflare Access at `https://apteki.nerfthis.xyz`.

## Later Enhancements

Do not build these during MVP unless explicitly requested.

### City setup/settings

If env vars are missing, show first-run setup:

- Google autocomplete for city/town.
- Persist selected default center.
- Add settings screen to change default city later.

### Nearby discovery mode

Add a user-triggered “Find nearby pharmacies” action:

- Search current map area for pharmacies.
- Show candidates separately from tracked pharmacies.
- Let user import selected candidates.
- Do not automatically persist every result.

### History UI

Expose `pharmacy_events`:

- Visit history.
- Stocked/not-stocked change history.
- Basic audit log.

### Filters

Add filters:

- All
- Stocked
- Not stocked
- Recently visited
- Needs visit

### Notes/custom labels

Only add if the actual workflow needs it.

## Build Order Summary

1. Nuxt + Cloudflare Workers scaffold.
2. D1 schema/migrations.
3. Pharmacy API.
4. Marker state/date logic tests.
5. Google Map shell.
6. Render tracked pharmacy markers.
7. Details drawer actions.
8. Google Places add flow.
9. Polish/Wrangler deployment docs.
