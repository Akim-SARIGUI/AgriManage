<template>
  <div class="space-y-5">
    <div class="admin-hero rounded-2xl p-6 text-white shadow-agri">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--agri-wheat)]">
            Administration
          </p>
          <h1 class="mt-2 font-display text-2xl font-semibold md:text-3xl">
            Tableau de bord système
          </h1>
          <p class="mt-2 max-w-2xl text-sm text-white/90">
            Pilotez les comptes, le support et la santé de la plateforme — sans accès aux données
            d’exploitation des agriculteurs.
          </p>
        </div>
        <v-btn
          variant="outlined"
          color="white"
          prepend-icon="mdi-refresh"
          :loading="loading"
          class="border-white/40!"
          @click="reload"
        >
          Actualiser
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" density="comfortable" prominent>
      {{ error }}
      <template #append>
        <v-btn variant="text" color="white" size="small" @click="reload">Réessayer</v-btn>
      </template>
    </v-alert>

    <div v-if="loading && !overview" class="pa-10 text-center text-medium-emphasis">
      Chargement du tableau de bord…
    </div>

    <template v-else-if="overview">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NuxtLink to="/admin/users" class="agri-kpi-card block p-4 no-underline transition hover:-translate-y-0.5">
          <p class="text-sm text-[color:var(--agri-muted)]">Utilisateurs</p>
          <p class="mt-1 text-3xl font-semibold text-[color:var(--agri-forest)]">
            {{ overview.users.total }}
          </p>
          <p class="mt-1 text-xs text-[color:var(--agri-muted)]">
            {{ overview.users.farmers }} agriculteurs · {{ overview.users.admins }} admins
          </p>
        </NuxtLink>
        <NuxtLink to="/admin/users" class="agri-kpi-card block p-4 no-underline transition hover:-translate-y-0.5">
          <p class="text-sm text-[color:var(--agri-muted)]">Comptes verrouillés</p>
          <p class="mt-1 text-3xl font-semibold text-[color:var(--agri-soil)]">
            {{ overview.users.locked }}
          </p>
          <p class="mt-1 text-xs font-semibold text-agri-green">Gérer →</p>
        </NuxtLink>
        <NuxtLink to="/admin/tickets" class="agri-kpi-card block p-4 no-underline transition hover:-translate-y-0.5">
          <p class="text-sm text-[color:var(--agri-muted)]">Tickets ouverts</p>
          <p class="mt-1 text-3xl font-semibold text-amber-700">
            {{ overview.tickets.open }}
          </p>
          <p class="mt-1 text-xs text-[color:var(--agri-muted)]">
            {{ overview.tickets.inProgress }} en cours · {{ overview.tickets.closed }} fermés
          </p>
        </NuxtLink>
        <NuxtLink to="/admin/system" class="agri-kpi-card block p-4 no-underline transition hover:-translate-y-0.5">
          <p class="text-sm text-[color:var(--agri-muted)]">Santé système</p>
          <p
            class="mt-1 text-3xl font-semibold"
            :class="overview.health.status === 'ok' ? 'text-agri-green' : 'text-red-700'"
          >
            {{ overview.health.status === 'ok' ? 'OK' : 'Dégradé' }}
          </p>
          <p class="mt-1 text-xs font-semibold text-agri-green">Détails →</p>
        </NuxtLink>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <AgriPageCard title="Actions rapides" icon="mdi-lightning-bolt">
          <div class="flex flex-wrap gap-3">
            <v-btn color="primary" prepend-icon="mdi-account-plus" to="/admin/users">
              Créer un utilisateur
            </v-btn>
            <v-btn color="secondary" prepend-icon="mdi-inbox" to="/admin/tickets">
              Voir les requêtes
              <v-badge
                v-if="overview.tickets.open > 0"
                :content="overview.tickets.open"
                color="warning"
                inline
                class="ml-2"
              />
            </v-btn>
            <v-btn variant="tonal" color="primary" prepend-icon="mdi-heart-pulse" to="/admin/system">
              Santé système
            </v-btn>
          </div>
        </AgriPageCard>

        <AgriPageCard title="Dernières inscriptions" icon="mdi-account-clock">
          <v-alert
            v-if="overview.recentUsers.length === 0"
            type="info"
            variant="tonal"
            density="comfortable"
          >
            Aucun utilisateur pour le moment. Créez le premier compte depuis Utilisateurs.
          </v-alert>
          <div v-else class="space-y-2">
            <div
              v-for="item in overview.recentUsers"
              :key="item.id"
              class="flex items-center justify-between rounded-lg border border-[color:var(--agri-border)] px-3 py-2"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-[color:var(--agri-forest)]">
                  {{ item.fullName }}
                </p>
                <p class="truncate text-xs text-[color:var(--agri-muted)]">{{ item.email }}</p>
              </div>
              <v-chip size="x-small" :color="item.role === Role.ADMIN ? 'secondary' : 'success'" variant="tonal">
                {{ item.role === Role.ADMIN ? 'Admin' : 'User' }}
              </v-chip>
            </div>
          </div>
        </AgriPageCard>
      </div>

      <AgriPageCard title="Dernières demandes support" icon="mdi-lifebuoy">
        <v-alert
          v-if="overview.recentTickets.length === 0"
          type="info"
          variant="tonal"
          density="comfortable"
        >
          Aucune demande pour le moment. Les tickets des utilisateurs apparaîtront ici.
        </v-alert>
        <div v-else class="space-y-2">
          <NuxtLink
            v-for="ticket in overview.recentTickets"
            :key="ticket.id"
            :to="{ path: '/admin/tickets', query: { focus: ticket.id } }"
            class="block rounded-lg border border-[color:var(--agri-border)] px-3 py-3 no-underline transition hover:bg-[color:var(--agri-mist)]"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[color:var(--agri-forest)]">{{ ticket.name }}</p>
                <p class="text-xs text-[color:var(--agri-muted)]">
                  {{ ticket.email }} · {{ formatDate(ticket.createdAt) }}
                </p>
                <p class="mt-1 line-clamp-1 text-xs text-[color:var(--agri-ink)]">
                  {{ ticket.message }}
                </p>
              </div>
              <v-chip size="x-small" variant="tonal" :color="ticketStatusColor(ticket.status)">
                {{ ticketStatusLabel(ticket.status) }}
              </v-chip>
            </div>
          </NuxtLink>
        </div>
      </AgriPageCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Role, SupportStatus, type AdminOverviewDto } from '@agrimanage/shared';

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
});

const api = useApiClient();
const overview = ref<AdminOverviewDto | null>(null);
const loading = ref(true);
const error = ref('');

onMounted(() => {
  void reload();
});

async function reload() {
  loading.value = true;
  error.value = '';
  try {
    overview.value = await api.getAdminOverview();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Impossible de charger le tableau de bord';
  } finally {
    loading.value = false;
  }
}

function ticketStatusLabel(status: SupportStatus) {
  if (status === SupportStatus.OPEN) return 'Ouverte';
  if (status === SupportStatus.IN_PROGRESS) return 'En cours';
  return 'Fermée';
}

function ticketStatusColor(status: SupportStatus) {
  if (status === SupportStatus.OPEN) return 'warning';
  if (status === SupportStatus.IN_PROGRESS) return 'info';
  return 'success';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR');
}
</script>

<style scoped>
.admin-hero {
  background: linear-gradient(90deg, var(--agri-forest), var(--agri-green));
  border: 1px solid rgba(255, 255, 255, 0.12);
}
</style>
