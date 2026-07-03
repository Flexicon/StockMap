# StockMap

StockMap is a private family app for tracking local pharmacies on a Google Map.

The intended production URL is `https://apteki.nerfthis.xyz`. Cloudflare Access will protect the deployed app at the edge.

## Local Development

Use Node.js `24.18.0`. The version is pinned in `mise.toml` for local development and `.node-version` for Cloudflare builds.

Install dependencies:

```bash
npm install
```

Start the Nuxt dev server on the Phase 0 LAN port:

```bash
npm run dev
```

The dev server binds to `0.0.0.0` on port `6277`, so it is reachable from another LAN device at `http://<machine-ip>:6277`.

For Cloudflare-compatible local preview with D1 bindings, build and run Wrangler:

```bash
npm run build
npm run preview:cf
```

## Environment

Copy `.env.example` to `.env` and set values as they become available:

```env
NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
GOOGLE_MAPS_SERVER_KEY=
DEFAULT_MAP_LAT=
DEFAULT_MAP_LNG=
DEFAULT_MAP_ZOOM=13
```

Use `.dev.vars` for local Wrangler secrets:

```env
GOOGLE_MAPS_SERVER_KEY=...
```

Do not commit `.env` or `.dev.vars`.

## D1

Create the database once:

```bash
npx wrangler d1 create stockmap
```

Copy the returned `database_id` into `wrangler.toml`.

Apply migrations locally:

```bash
npx wrangler d1 migrations apply stockmap --local
```

Apply migrations remotely:

```bash
npx wrangler d1 migrations apply stockmap --remote
```

## Verification

```bash
npm run check
npm run build
```

## Cloudflare Workers

Cloudflare Worker settings live in `wrangler.toml`.

Preview the built Worker locally:

```bash
npm run preview:cf
```

Final Wrangler deployment, D1 migration, secret, and Cloudflare Access commands will be documented near the end of the MVP.

Deploy:

```bash
npm run build
npx wrangler deploy
```

Set the server-side Google key as a Worker secret:

```bash
npx wrangler secret put GOOGLE_MAPS_SERVER_KEY
```

Tail logs:

```bash
npx wrangler tail stockmap
```

## Cloudflare Access

Protect `https://apteki.nerfthis.xyz` with a Cloudflare Access self-hosted application. Allow only the family emails or identity groups that should use the app. The app intentionally has no username/password, sessions, OAuth, or roles.

## Google Cloud Keys

Use two keys:

- `NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`: restrict by HTTP referrer to local dev origins and `https://apteki.nerfthis.xyz/*`; allow Maps JavaScript API and Places API.
- `GOOGLE_MAPS_SERVER_KEY`: store as a Cloudflare secret; restrict by server-side usage where practical; allow Places API.
