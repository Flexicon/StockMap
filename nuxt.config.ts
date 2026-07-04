export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Apteki',
      link: [
        { rel: 'icon', href: 'https://fav.farm/%F0%9F%92%8A' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#fffaf0' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Apteki' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
    },
  },
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    googleMapsServerKey: process.env.GOOGLE_MAPS_SERVER_KEY || '',
    public: {
      googleMapsBrowserKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY || '',
      googleMapsMapId: process.env.NUXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
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
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Apteki',
      short_name: 'Apteki',
      description: 'Track pharmacies for the family.',
      lang: 'en',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#fffaf0',
      theme_color: '#fffaf0',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      navigateFallback: null,
      runtimeCaching: [],
      skipWaiting: true,
    },
  },
})
