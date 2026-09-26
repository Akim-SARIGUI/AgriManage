import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: { mdi },
    },
    theme: {
      defaultTheme: 'agri',
      themes: {
        agri: {
          dark: false,
          colors: {
            primary: '#2d6a4f',
            secondary: '#7f5539',
            accent: '#95d5b2',
            background: '#f3f7f4',
            surface: '#FFFFFF',
            error: '#bc4749',
            info: '#3a7ca5',
            success: '#40916c',
            warning: '#c9a227',
          },
        },
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
