export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss'],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'StockMap',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    googleMapsServerKey: process.env.GOOGLE_MAPS_SERVER_KEY || '',
    public: {
      googleMapsBrowserKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY || '',
      defaultMapLat: process.env.DEFAULT_MAP_LAT || '',
      defaultMapLng: process.env.DEFAULT_MAP_LNG || '',
      defaultMapZoom: Number(process.env.DEFAULT_MAP_ZOOM || 13),
    },
  },
  devServer: {
    host: '0.0.0.0',
    port: 6277,
  },
  compatibilityDate: '2026-07-02',
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: 'stockmap',
        workers_dev: false,
        compatibility_flags: ['nodejs_compat'],
        d1_databases: [
          {
            binding: 'DB',
            database_name: 'stockmap',
            database_id: '47b504fa-02a1-4a87-9a70-4687fcf8658f',
            migrations_dir: './migrations',
          },
        ],
        routes: [
          {
            pattern: 'apteki.nerfthis.xyz',
            custom_domain: true,
          },
        ],
        dev: {
          ip: '0.0.0.0',
          port: 6277,
        },
        observability: {
          enabled: true,
        },
      },
    },
  },
  typescript: {
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        types: ['google.maps', 'node'],
      },
    },
  },
  eslint: {
    config: {
      stylistic: {
        indent: 2,
        semi: false,
        quotes: 'single',
      },
    },
  },
})
