import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
    'leaflet/dist/leaflet.css',
  ],
  modules: [
    '@nuxtjs/tailwindcss',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins = config.plugins || [];
        config.plugins.push(
          vuetify({
            autoImport: true,
          }),
        );
      });
    },
  ],
  build: {
    transpile: ['vuetify', '@agrimanage/api-client', '@agrimanage/shared'],
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    ssr: {
      noExternal: ['vuetify', '@agrimanage/api-client', '@agrimanage/shared'],
    },
    optimizeDeps: {
      include: ['@agrimanage/api-client', '@agrimanage/shared'],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api',
    },
  },
  app: {
    head: {
      title: 'AgriManage',
      titleTemplate: '%s · AgriManage',
      link: [
        { rel: 'icon', type: 'image/png', href: '/agrimanage-icon.png' },
        { rel: 'apple-touch-icon', href: '/agrimanage-icon.png' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap',
        },
      ],
      meta: [
        {
          name: 'description',
          content: 'Plateforme de gestion agricole pour les agriculteurs',
        },
        { name: 'theme-color', content: '#1b4332' },
      ],
    },
  },
});