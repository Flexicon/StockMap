# StockMap

StockMap is a private family app for tracking local pharmacies on a Google Map.

The intended production URL is `https://apteki.nerfthis.xyz`. Cloudflare Access will protect the deployed app at the edge.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Nuxt dev server on the Phase 0 LAN port:

```bash
npm run dev
```

The dev server binds to `0.0.0.0` on port `6277`, so it is reachable from another LAN device at `http://<machine-ip>:6277`.

## Environment

Copy `.env.example` to `.env` and set values as they become available:

```env
NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
GOOGLE_MAPS_SERVER_KEY=
DEFAULT_MAP_LAT=
DEFAULT_MAP_LNG=
DEFAULT_MAP_ZOOM=13
```

## Verification

```bash
npm run check
npm run build
```

## Cloudflare Workers

Cloudflare Worker settings live in `nuxt.config.ts` under `nitro.cloudflare`. Nuxt/Nitro generates the Wrangler deployment config during `npm run build`.

Preview the built Worker locally:

```bash
npm run preview:cf
```

Final Wrangler deployment, D1 migration, secret, and Cloudflare Access commands will be documented near the end of the MVP.
