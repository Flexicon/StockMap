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
    googleMapsServerKey: '',
    public: {
      googleMapsBrowserKey: '',
      defaultMapLat: '',
      defaultMapLng: '',
      defaultMapZoom: 13,
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
