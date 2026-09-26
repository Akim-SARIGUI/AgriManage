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
          to="/admin"
          :size="38"
          light
          variant="png"
          tagline="Admin OS"
          @click="closeMobile"
        />
      </div>

      <div class="app-sidebar__scroll">
        <nav class="app-nav" aria-label="Navigation administration">
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
              <v-badge
                v-if="item.to === '/admin/tickets' && openTickets > 0"
                :content="openTickets"
                color="warning"
                inline
                class="ml-auto"
              />
            </NuxtLink>
          </section>
        </nav>
      </div>

      <div class="app-sidebar__footer">
        <div class="app-user">
          <v-avatar size="38" class="app-user__avatar">
            <span>{{ initials }}</span>
          </v-avatar>
          <div class="app-user__meta">
            <p class="app-user__name">{{ user?.fullName ?? 'Admin' }}</p>
            <p class="app-user__email">{{ user?.email }}</p>
          </div>
        </div>
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
          <v-menu location="bottom end" offset="8">
            <template #activator="{ props: menuProps }">
              <button v-bind="menuProps" type="button" class="app-profile-chip">
                <v-avatar size="32" class="app-profile-chip__avatar">
                  <span>{{ initials }}</span>
                </v-avatar>
                <span v-if="mdAndUp" class="app-profile-chip__name">
                  {{ user?.fullName?.split(' ')[0] ?? 'Admin' }}
                </span>
                <v-icon size="18">mdi-chevron-down</v-icon>
              </button>
            </template>
            <v-list density="compact" min-width="220" class="rounded-lg! py-2">
              <v-list-item
                prepend-icon="mdi-view-dashboard-outline"
                title="Tableau de bord"
                to="/admin"
              />
              <v-list-item
                prepend-icon="mdi-heart-pulse"
                title="Santé système"
                to="/admin/system"
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
const api = useApiClient();
const route = useRoute();
const { mdAndUp } = useDisplay();
const drawer = ref(true);
const scrolled = ref(false);
const openTickets = ref(0);

watch(mdAndUp, (value) => {
  drawer.value = value;
});

onMounted(() => {
  drawer.value = mdAndUp.value;
  void fetchMe();
  void loadOpenTickets();
  window.addEventListener('scroll', onScroll, { passive: true });
});

async function loadOpenTickets() {
  try {
    const overview = await api.getAdminOverview();
    openTickets.value = overview.tickets.open;
  } catch {
    openTickets.value = 0;
  }
}

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
  if (to === '/admin') {
    return route.path === '/admin' || route.path === '/admin/';
  }
  return route.path === to || route.path.startsWith(`${to}/`);
}

const navSections = [
  {
    title: 'Overview',
    items: [{ title: 'Tableau de bord', to: '/admin', icon: 'mdi-view-dashboard-outline' }],
  },
  {
    title: 'Gestion',
    items: [
      { title: 'Utilisateurs', to: '/admin/users', icon: 'mdi-account-group-outline' },
      { title: 'Requêtes support', to: '/admin/tickets', icon: 'mdi-inbox-outline' },
    ],
  },
  {
    title: 'Système',
    items: [{ title: 'Santé système', to: '/admin/system', icon: 'mdi-heart-pulse' }],
  },
];

const titleByPath: Record<string, string> = {
  '/admin': 'Tableau de bord',
  '/admin/users': 'Utilisateurs',
  '/admin/tickets': 'Requêtes support',
  '/admin/system': 'Santé système',
};

const sectionByPath: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/users': 'Gestion',
  '/admin/tickets': 'Gestion',
  '/admin/system': 'Système',
};

const sectionLabel = computed(() => sectionByPath[route.path] ?? 'Administration');

const pageTitle = computed(() => {
  if (route.path === '/admin' || route.path === '/admin/') return 'Tableau de bord';
  return titleByPath[route.path] ?? 'Administration';
});

const initials = computed(() => {
  const name = user.value?.fullName?.trim() || 'A';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
});

watch(
  () => route.path,
  () => {
    if (route.path.startsWith('/admin')) {
      void loadOpenTickets();
    }
  },
);

async function onLogout() {
  await logout();
  await navigateTo('/admin/login');
}
</script>
