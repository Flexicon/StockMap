# AGENTS.md

## Project Summary

Build **StockMap**, a small internal family web app for tracking local pharmacies on a Google Maps map.

The intended production URL is `https://apteki.nerfthis.xyz`.

The app is protected externally by Cloudflare Access. It has no application-level authentication, no user accounts, and no roles.

The app lets family members:

- View a Google Map centered on a configured town/city in Poland.
- See tracked pharmacies as map markers.
- Click/tap a pharmacy marker to view basic details.
- Mark a pharmacy as visited today.
- Toggle whether a pharmacy is currently stocked for the family’s usual prescription needs.
- Add new pharmacies via Google Places search/autocomplete.
- Hard-delete tracked pharmacies.

The app tracks only pharmacies explicitly added by the user. It does not automatically import all pharmacies from the current map viewport in the MVP.

## Current Implementation State

The MVP is implemented in this repository.

Implemented:

- Nuxt 4 app deployed as a Cloudflare Worker.
- Tailwind CSS for styling and Reka UI for the delete confirmation dialog.
- Raw SQL D1 migration and server helpers for `pharmacies` and `pharmacy_events`.
- Nuxt server routes for tracked pharmacy CRUD, visit-today, stocked toggle, and Google Place details lookup.
- Google Maps JavaScript API map shell with approximate Poland bounds.
- Google Places autocomplete search for adding tracked pharmacies.
- Marker state/date logic in shared pure functions with Vitest coverage.
- Full-screen map UI with a floating search control and compact responsive details drawer.
- Optimistic UI updates for visit, stocked toggle, and delete.
- Short inline error states.
- README deployment notes for Wrangler, D1 migrations, Cloudflare Access, and Google key restrictions.

Current UI decisions:

- Do not show a marker legend by default.
- Do not show verbose empty-state text or an “Add first” chip.
- Do not use a decorative plus icon in the search field; selecting a Google Places result is the add action.
- Keep visible copy sparse, but preserve accessible labels for controls.

Before production use, create the real D1 database, replace the placeholder D1 database id in config, set secrets/env vars, apply migrations, and verify the deployed custom domain behind Cloudflare Access.

## Product Design Direction

Build the UI with as little actual text as possible. The app should feel direct, calm, and obvious, closer to the product sensibility of 37signals apps such as Campfire, Fizzy, Writebook, and Basecamp than a dense enterprise dashboard.

Prefer:

- clear spatial layout over explanatory copy
- icons, color, position, and simple controls over long labels
- short nouns and verbs over sentences
- progressive disclosure over always-visible instructions
- plain, friendly, tactile surfaces over glossy or hacker-style UI
- obvious primary actions with minimal surrounding chrome

Avoid:

- marketing-style hero copy inside the app
- verbose helper text and empty-state paragraphs
- dashboard cards full of labels, legends, and metadata
- clever microcopy that slows down quick family use
- generic SaaS density, dark terminal aesthetics, or admin-console styling

Text is still acceptable where it prevents ambiguity or supports accessibility, but default to the shortest clear wording. Use accessible names and ARIA labels even when visible UI text is intentionally sparse.

## Preferred Stack

Use this stack unless there is a strong technical reason not to:

- Nuxt 4
- TypeScript
- Tailwind CSS
- Reka UI
- Cloudflare Workers
- Cloudflare D1
- Google Maps JavaScript API
- Google Places API / Places Library
- Raw SQL for D1 routes and migrations unless the data access layer grows enough to justify Drizzle later

Do not build this as a generic multi-tenant SaaS app. It is a private internal tool.

## Deployment Target

The app must deploy to Cloudflare Workers.

Use Cloudflare D1 for persistence.

Cloudflare Access will protect the app at the edge. Do not add username/password login, sessions, OAuth, or application-level auth in the MVP.

Use Wrangler CLI for Cloudflare deployment and D1 operations once the MVP is ready to deploy. Prefer a checked-in `wrangler.jsonc` config and document final commands such as `wrangler deploy`, D1 migration application, and secret setup in the README near the end of the MVP.

The production route/custom domain should target `https://apteki.nerfthis.xyz`.

## Local Development

The development server should listen on port `6277` (`MAPS` on a T9 keypad).

The dev server should bind to the LAN, not only localhost, so it is reachable from other devices on the same network at `http://<machine-ip>:6277`.

Use the project’s Nuxt/Wrangler-compatible dev command to enforce this host/port once the scaffold exists.

## Configuration

Use environment variables for initial map configuration:

```env
NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
GOOGLE_MAPS_SERVER_KEY=
DEFAULT_MAP_LAT=
DEFAULT_MAP_LNG=
DEFAULT_MAP_ZOOM=13
```

For MVP, the default town/city is configured through env vars.

Future enhancement: if no default city is configured, show an initial setup screen with Google Places autocomplete for city selection, persist the selected city in D1 or local storage, and allow changing it in app settings. Do not build this in the MVP unless explicitly requested.

## Domain Language

Use the term **stocked** for the internal availability concept.

Meaning:

- `is_stocked = true`: this pharmacy is currently believed to carry the prescriptions/items the family usually needs.
- `is_stocked = false`: this pharmacy is currently believed not to carry those items.

This is internal app-owned state. It is not the same as Google business status, opening hours, or whether the pharmacy exists.

Avoid using ambiguous labels like “available/unavailable” in the code and UI unless referring to generic UI state.

Preferred UI labels:

- “Stocked”
- “Not stocked”
- “Mark as stocked”
- “Mark as not stocked”

## Google Maps and Places Rules

Use Google Maps to render the map.

Use Google Places search/autocomplete only to add/import pharmacies to the tracked list.

Do not fetch pharmacies automatically whenever the user pans or zooms the map in the MVP.

When adding a pharmacy:

1. User searches using Google Places autocomplete/search.
2. User selects a result.
3. App resolves the Google Place ID and basic display details.
4. App creates a tracked pharmacy record in D1.
5. App prevents duplicate tracked pharmacies by `google_place_id`.

The canonical external identifier is the Google Place ID.

Prefer storing permanently:

- `google_place_id`
- app-owned state such as `is_stocked`
- app-owned visit data
- timestamps

Google-derived display fields such as name, address, lat/lng may be cached for app performance, but treat them as refreshable cached data, not the canonical source of truth.

## Map Behavior

Initial map position comes from env vars.

The map should be pannable and zoomable.

The app should not lock the user to a specific town after initial load.

If easy, restrict panning roughly to Poland using approximate bounds:

```ts
const POLAND_BOUNDS = {
  north: 55.2,
  south: 49.0,
  west: 14.0,
  east: 24.5,
}
```

Do not over-engineer geospatial correctness for the MVP.

## Marker State and Coloring

Marker color priority:

1. Not stocked pharmacies are grey.
2. Pharmacies with no visit date use the default available/stocked marker style.
3. Recently visited stocked pharmacies are colored by recency.
4. Pharmacies visited more than 37 days ago return to the default marker style.

Suggested recency buckets:

```ts
function markerState(pharmacy: Pharmacy, today: Date): MarkerState {
  if (!pharmacy.isStocked) return 'not-stocked'
  if (!pharmacy.lastVisitedOn) return 'default'

  const days = differenceInCalendarDays(today, parseISO(pharmacy.lastVisitedOn))

  if (days <= 3) return 'visited-hot'
  if (days <= 14) return 'visited-warm'
  if (days <= 30) return 'visited-aging'
  if (days <= 37) return 'visited-stale'

  return 'default'
}
```

Suggested UI meaning:

- `not-stocked`: grey
- `visited-hot`: deep red
- `visited-warm`: red/orange
- `visited-aging`: yellow/green
- `visited-stale`: green
- `default`: standard stocked marker

Use semantic CSS variables/classes instead of scattering raw colors through components.

## Data Model

Use D1 tables similar to the following.

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

CREATE INDEX idx_pharmacies_place_id ON pharmacies (google_place_id);
CREATE INDEX idx_pharmacies_last_visited ON pharmacies (last_visited_on);
CREATE INDEX idx_pharmacies_stocked ON pharmacies (is_stocked);
```

Add visit/event history early:

```sql
CREATE TABLE pharmacy_events (
  id TEXT PRIMARY KEY,
  pharmacy_id TEXT NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pharmacy_events_pharmacy_id ON pharmacy_events (pharmacy_id);
CREATE INDEX idx_pharmacy_events_event_date ON pharmacy_events (event_date);
```

For MVP UI, show only the latest visit date, even though visit events are stored for audit/history.

Do not add notes, custom names, user accounts, or editing UI unless explicitly requested.

Hard-delete pharmacies in the MVP. Deleting a pharmacy should delete associated event history through cascading delete if supported by the chosen D1/migration setup. If cascade support is awkward, delete child events explicitly in the API handler.

## API Shape

Use Nuxt server routes.

Suggested endpoints:

```text
GET    /api/pharmacies
POST   /api/pharmacies
PATCH  /api/pharmacies/:id
DELETE /api/pharmacies/:id
POST   /api/pharmacies/:id/visit-today
POST   /api/pharmacies/:id/toggle-stocked
GET    /api/places/details?placeId=...
```

Expected behavior:

- `GET /api/pharmacies`: returns tracked pharmacies.
- `POST /api/pharmacies`: creates a tracked pharmacy from a Google Place ID and cached display fields.
- `PATCH /api/pharmacies/:id`: updates supported app-owned fields only.
- `DELETE /api/pharmacies/:id`: hard-deletes the pharmacy.
- `POST /api/pharmacies/:id/visit-today`: sets `last_visited_on` to today and inserts a `pharmacy_events` row.
- `POST /api/pharmacies/:id/toggle-stocked`: toggles `is_stocked` and inserts a `pharmacy_events` row.
- `GET /api/places/details`: fetches minimal Google Place details when needed.

Use Zod or equivalent validation for server route input.

Return typed JSON responses. Keep response shapes boring and explicit.

## UI Requirements

Main screen:

- Full-screen Google Map.
- Search/add pharmacy control.
- Markers for tracked pharmacies.
- Selected pharmacy drawer/panel.
- Minimal visible copy; map, markers, and a small number of clear controls should carry the interface.

Desktop layout:

- Full-screen map.
- Search/add control near the top-left.
- Details drawer on the right when a pharmacy is selected.

Mobile/tablet layout:

- Full-screen map.
- Floating search/add control.
- Bottom sheet for selected pharmacy details.
- Large tap targets.

Selected pharmacy details should show:

- Pharmacy name from cached Google details.
- Address from cached Google details, if present.
- Last visited date.
- Relative age of last visit.
- Stocked/not stocked state.
- One-click/tap “Mark visited today”.
- One-click/tap stocked/not-stocked toggle.
- Delete action.

Keep the details panel compact. Prefer a small set of large actions, state chips, and dates over explanatory text blocks.

No notes/custom labels in MVP.

## State Management

Keep state simple.

Prefer Vue composables and local component state over global stores unless state starts to sprawl.

Use optimistic updates for:

- Mark visited today.
- Toggle stocked/not-stocked.

On API error, revert local state and show a small error toast or inline error.

## Date Handling

Use calendar dates for visits, not timestamps.

Store `last_visited_on` and `event_date` as ISO date strings:

```text
YYYY-MM-DD
```

The app is for Poland. Treat “today” according to the app/user’s local timezone. Avoid UTC date rollover bugs.

## Styling

Use Tailwind CSS.

Use a bright, pharmacy-adjacent pastel palette: teal as the brand-primary color, supported by mint, sage, cream, peach, lavender, and soft neutrals. Avoid making the app feel dark, cyberpunk, or hacker-like.

Keep the visual language sparse and tactile: soft panels, generous spacing, rounded controls, clear affordances, and minimal labels.

Use Reka UI for accessible primitives when useful, especially for:

- dialogs
- drawers/sheets
- popovers
- toggles/switches
- dropdown menus

Do not overbuild a design system.

Prefer simple semantic components:

- `PharmacyMap`
- `PharmacyMarker`
- `PharmacyDetailsDrawer`
- `AddPharmacySearch`
- `StockedToggle`
- `VisitTodayButton`

## Testing

At minimum, add tests for pure business logic:

- marker state calculation
- date bucketing
- stocked/not-stocked precedence over visit recency
- API validation helpers, if practical

Use the project’s natural test runner based on the scaffold. Vitest is preferred for Nuxt/TypeScript logic tests.

Do not spend MVP time on brittle Google Maps browser automation tests.

## Non-Goals for MVP

Do not build these unless explicitly requested:

- App-level auth
- Multi-user accounts
- Roles/permissions
- Automatic viewport-based pharmacy discovery
- Route planning
- Opening-hours logic
- Prescription inventory management
- Push/email notifications
- Notes/custom aliases
- City setup/settings UI
- Import/export
- Offline mode
- Complex analytics

## Implementation Style

Keep the app small and explicit.

Prefer boring code over abstractions.

Do not create generic repositories/services unless they reduce real duplication.

Keep database access close to server routes or in a small server-side module.

Use strong TypeScript types for pharmacy data and API responses.

Use clear naming around the internal stocked/not-stocked concept.
