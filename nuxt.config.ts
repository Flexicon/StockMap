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
