<template>
  <div class="app-shell">
    <v-navigation-drawer
      v-model="drawer"
      :permanent="mdAndUp"
      :temporary="!mdAndUp"
      width="272"
      class="app-sidebar"
      elevation="0"
    >
      <div class="app-sidebar__brand">
        <AgriBrand
          to="/app"
          :size="38"
          light
          variant="png"
          tagline="Farm OS"
          @click="closeMobile"
        />
      </div>

      <div class="app-sidebar__scroll">
        <nav class="app-nav" aria-label="Navigation principale">
          <section v-for="section in navSections" :key="section.title" class="app-nav__section">
            <p class="app-nav__label">{{ section.title }}</p>
            <NuxtLink
              v-for="item in section.items"
              :key="item.to"
              :to="item.to"
              class="app-nav__item"
              :class="{ 'app-nav__item--active': isActive(item.to) }"
              @click="closeMobile"
            >
              <v-icon size="20" class="app-nav__icon">{{ item.icon }}</v-icon>
              <span class="app-nav__title">{{ item.title }}</span>
            </NuxtLink>
          </section>
        </nav>
      </div>

      <div class="app-sidebar__footer">
        <NuxtLink to="/app/profile" class="app-user" @click="closeMobile">
          <v-avatar size="38" class="app-user__avatar">
            <span>{{ initials }}</span>
          </v-avatar>
          <div class="app-user__meta">
            <p class="app-user__name">{{ user?.fullName ?? 'Compte' }}</p>
            <p class="app-user__email">{{ user?.email }}</p>
          </div>
          <v-icon size="18" class="app-user__chevron">mdi-chevron-right</v-icon>
        </NuxtLink>
        <button type="button" class="app-logout" @click="onLogout">
          <v-icon size="18">mdi-logout</v-icon>
          <span>Déconnexion</span>
        </button>
      </div>
    </v-navigation-drawer>

    <v-app-bar
      flat
      height="64"
      class="app-topbar"
      :class="{ 'app-topbar--scrolled': scrolled }"
    >
      <div class="app-topbar__inner">
        <div class="app-topbar__left">
          <button
            type="button"
            class="app-topbar__menu"
            aria-label="Ouvrir le menu"
            @click="drawer = !drawer"
          >
            <v-icon>mdi-menu</v-icon>
          </button>
          <div class="app-topbar__titles">
            <p class="app-topbar__eyebrow">{{ sectionLabel }}</p>
            <h1 class="app-topbar__title">{{ pageTitle }}</h1>
          </div>
        </div>

        <div class="app-topbar__right">
          <ClientOnly>
            <NotificationBell tone="light" />
            <template #fallback>
              <button type="button" class="app-icon-btn" aria-label="Notifications">
                <v-icon>mdi-bell-outline</v-icon>
              </button>
            </template>
          </ClientOnly>

          <v-menu location="bottom end" offset="8">
            <template #activator="{ props: menuProps }">
              <button v-bind="menuProps" type="button" class="app-profile-chip">
                <v-avatar size="32" class="app-profile-chip__avatar">
                  <span>{{ initials }}</span>
                </v-avatar>
                <span v-if="mdAndUp" class="app-profile-chip__name">
                  {{ user?.fullName?.split(' ')[0] ?? 'Profil' }}
                </span>
                <v-icon size="18">mdi-chevron-down</v-icon>
              </button>
            </template>
            <v-list density="compact" min-width="200" class="rounded-lg! py-2">
              <v-list-item
                prepend-icon="mdi-account-outline"
                title="Mon profil"
                to="/app/profile"
              />
              <v-list-item
                prepend-icon="mdi-lifebuoy"
                title="Support"
                to="/app/support"
              />
              <v-divider class="my-1" />
              <v-list-item
                prepend-icon="mdi-logout"
                title="Déconnexion"
                base-color="error"
                @click="onLogout"
              />
            </v-list>
          </v-menu>
        </div>
      </div>
    </v-app-bar>

    <v-main class="app-main">
      <div class="app-main__frame">
        <div class="agri-page-enter app-main__content">
          <slot />
        </div>
      </div>
    </v-main>
  </div>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';

const { user, logout, fetchMe } = useAuth();
const route = useRoute();
const { mdAndUp } = useDisplay();
const drawer = ref(true);
const scrolled = ref(false);

watch(mdAndUp, (value) => {
  drawer.value = value;
});

onMounted(() => {
  drawer.value = mdAndUp.value;
  void fetchMe();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
});

function onScroll() {
  scrolled.value = window.scrollY > 4;
}

function closeMobile() {
  if (!mdAndUp.value) drawer.value = false;
}

function isActive(to: string) {
  const [path, query] = to.split('?');
  if (path === '/app') return route.path === '/app';
  if (!route.path.startsWith(path)) return false;
  if (!query) {
    if (path === '/app/stocks') return route.path.startsWith('/app/stocks');
    return route.path === path || route.path.startsWith(`${path}/`);
  }
  const params = new URLSearchParams(query);
  const type = params.get('type');
  const section = params.get('section');
  if (!route.path.startsWith('/app/stocks')) return false;
  if (String(route.query.type || '') !== String(type || '')) return false;
  if (type === 'HISTORY') {
    return String(route.query.section || 'produits') === String(section || 'produits');
  }
  return true;
}

const navSections = [
  {
    title: 'Overview',
    items: [{ title: 'Tableau de bord', to: '/app', icon: 'mdi-view-dashboard-outline' }],
  },
  {
    title: 'Exploitation',
    items: [
      { title: 'Parcelles', to: '/app/parcels', icon: 'mdi-map-outline' },
      { title: 'Carte', to: '/app/map', icon: 'mdi-map-marker-radius-outline' },
      { title: 'Cultures', to: '/app/crops', icon: 'mdi-leaf' },
    ],
  },
  {
    title: 'Intrants',
    items: [
      { title: 'Semences', to: '/app/stocks?type=SEED', icon: 'mdi-seed-outline' },
      { title: 'Engrais', to: '/app/stocks?type=FERTILIZER', icon: 'mdi-bottle-tonic-outline' },
      { title: 'Pesticides', to: '/app/stocks?type=PESTICIDE', icon: 'mdi-flask-outline' },
      {
        title: 'Historique',
        to: '/app/stocks?type=HISTORY&section=intrants',
        icon: 'mdi-history',
      },
    ],
  },
  {
    title: 'Produits récoltés',
    items: [
      { title: 'Récoltes', to: '/app/stocks?type=PRODUCT', icon: 'mdi-basket-outline' },
      {
        title: 'Historique',
        to: '/app/stocks?type=HISTORY&section=produits',
        icon: 'mdi-history',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      { title: 'Comptabilité', to: '/app/finance', icon: 'mdi-cash-multiple' },
      { title: 'Météo', to: '/app/weather', icon: 'mdi-weather-partly-cloudy' },
      { title: 'Rapports', to: '/app/reports', icon: 'mdi-file-chart-outline' },
      { title: 'Recommandations', to: '/app/recommendations', icon: 'mdi-lightbulb-on-outline' },
    ],
  },
  {
    title: 'Compte',
    items: [
      { title: 'Profil', to: '/app/profile', icon: 'mdi-account-outline' },
      { title: 'Support', to: '/app/support', icon: 'mdi-lifebuoy' },
    ],
  },
];

const titleByPath: Record<string, string> = {
  '/app': 'Tableau de bord',
  '/app/parcels': 'Parcelles',
  '/app/map': 'Carte',
  '/app/crops': 'Cultures',
  '/app/stocks': 'Stocks',
  '/app/finance': 'Comptabilité',
  '/app/weather': 'Météo',
  '/app/reports': 'Rapports',
  '/app/recommendations': 'Recommandations',
  '/app/profile': 'Profil',
  '/app/support': 'Support',
};

const sectionByPath: Record<string, string> = {
  '/app': 'Overview',
  '/app/parcels': 'Exploitation',
  '/app/map': 'Exploitation',
  '/app/crops': 'Exploitation',
  '/app/stocks': 'Stocks',
  '/app/finance': 'Operations',
  '/app/weather': 'Operations',
  '/app/reports': 'Operations',
  '/app/recommendations': 'Operations',
  '/app/profile': 'Compte',
  '/app/support': 'Compte',
};

const sectionLabel = computed(() => {
  if (route.path.startsWith('/app/crops/')) return 'Exploitation';
  if (route.path.startsWith('/app/stocks')) {
    const type = String(route.query.type || 'HOME');
    const section = String(route.query.section || '');
    if (type === 'HOME' || type === '') return 'Stocks';
    if (type === 'HISTORY') {
      return section === 'intrants' ? 'Intrants' : 'Produits récoltés';
    }
    if (type === 'PRODUCT') return 'Produits récoltés';
    return 'Intrants';
  }
  return sectionByPath[route.path] ?? 'AgriManage';
});

const pageTitle = computed(() => {
  if (route.path.startsWith('/app/crops/')) return 'Détail culture';
  if (route.path.startsWith('/app/stocks')) {
    const type = String(route.query.type || 'HOME');
    const section = String(route.query.section || '');
    if (type === 'HOME' || type === '') return 'Gestion des stocks';
    if (type === 'HISTORY') {
      return section === 'intrants' ? 'Historique des intrants' : 'Historique des récoltes';
    }
    const labels: Record<string, string> = {
      SEED: 'Semences',
      FERTILIZER: 'Engrais',
      PESTICIDE: 'Pesticides',
      PRODUCT: 'Récoltes',
    };
    return labels[type] ?? 'Stocks';
  }
  return titleByPath[route.path] ?? 'AgriManage';
});

const initials = computed(() => {
  const name = user.value?.fullName?.trim() || 'A';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
});

async function onLogout() {
  await logout();
  await navigateTo('/auth/login');
}
</script>
