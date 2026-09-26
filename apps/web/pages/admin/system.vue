<template>
  <div class="space-y-5">
    <AgriPageCard title="Santé du système" icon="mdi-heart-pulse" subtitle="État de la plateforme AgriManage">
      <v-alert v-if="error" type="error" class="mb-4" density="comfortable">
        {{ error }}
        <template #append>
          <v-btn variant="text" size="small" @click="reload">Réessayer</v-btn>
        </template>
      </v-alert>

      <div v-if="loading && !health" class="pa-8 text-center text-medium-emphasis">Vérification…</div>

      <template v-else-if="health">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <v-chip
            size="large"
            :color="health.status === 'ok' ? 'success' : 'error'"
            variant="flat"
          >
            {{ health.status === 'ok' ? 'Système opérationnel' : 'Système dégradé' }}
          </v-chip>
          <span class="text-sm text-[color:var(--agri-muted)]">
            Service {{ health.service }} · {{ formatDate(health.timestamp) }}
          </span>
          <span v-if="latencyMs !== null" class="text-sm text-[color:var(--agri-muted)]">
            · Latence {{ latencyMs }} ms
          </span>
        </div>

        <div class="mb-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl border border-[color:var(--agri-border)] bg-white p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-[color:var(--agri-muted)]">
              API
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--agri-forest)]">
              {{ health.status === 'ok' ? 'Répond' : 'Problème' }}
            </p>
            <p class="mt-1 text-xs text-[color:var(--agri-muted)]">Endpoint /admin/system/health</p>
          </div>
          <div class="rounded-xl border border-[color:var(--agri-border)] bg-white p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-[color:var(--agri-muted)]">
              Base de données
            </p>
            <p
              class="mt-2 text-lg font-semibold"
              :class="health.status === 'ok' ? 'text-agri-green' : 'text-red-700'"
            >
              {{ health.status === 'ok' ? 'Connectée' : 'Indisponible' }}
            </p>
            <p class="mt-1 text-xs text-[color:var(--agri-muted)]">Ping SELECT 1</p>
          </div>
          <div class="rounded-xl border border-[color:var(--agri-border)] bg-white p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-[color:var(--agri-muted)]">
              Dernière vérif.
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--agri-forest)]">
              {{ formatTime(health.timestamp) }}
            </p>
            <p class="mt-1 text-xs text-[color:var(--agri-muted)]">{{ formatDate(health.timestamp) }}</p>
          </div>
        </div>

        <v-alert
          :type="health.status === 'ok' ? 'success' : 'warning'"
          variant="tonal"
          density="comfortable"
        >
          <template v-if="health.status === 'ok'">
            L’API et la base de données répondent correctement.
          </template>
          <template v-else>
            La base de données semble indisponible ou lente. Vérifiez Docker / Postgres.
          </template>
        </v-alert>

        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <div class="rounded-xl border border-[color:var(--agri-border)] bg-white p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-[color:var(--agri-muted)]">
              Périmètre admin
            </p>
            <ul class="mt-2 space-y-1 text-sm text-[color:var(--agri-forest)]">
              <li>• Gestion des comptes (création, verrouillage, rôles)</li>
              <li>• Traitement des demandes support</li>
              <li>• Supervision de la santé système</li>
            </ul>
          </div>
          <div class="rounded-xl border border-[color:var(--agri-border)] bg-white p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-[color:var(--agri-muted)]">
              Hors périmètre
            </p>
            <ul class="mt-2 space-y-1 text-sm text-[color:var(--agri-muted)]">
              <li>• Parcelles, cultures, stocks des agriculteurs</li>
              <li>• Comptabilité et données d’exploitation</li>
              <li>• Notifications métier individuelles</li>
            </ul>
          </div>
        </div>

        <div v-if="history.length" class="mt-5">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--agri-muted)]">
            Historique local des checks
          </p>
          <div class="space-y-2">
            <div
              v-for="(entry, index) in history"
              :key="`${entry.timestamp}-${index}`"
              class="flex items-center justify-between rounded-lg border border-[color:var(--agri-border)] px-3 py-2 text-sm"
            >
              <span>{{ formatDate(entry.timestamp) }}</span>
              <div class="flex items-center gap-2">
                <span class="text-[color:var(--agri-muted)]">{{ entry.latencyMs }} ms</span>
                <v-chip
                  size="x-small"
                  :color="entry.status === 'ok' ? 'success' : 'error'"
                  variant="tonal"
                >
                  {{ entry.status === 'ok' ? 'OK' : 'Dégradé' }}
                </v-chip>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap gap-3">
          <v-btn color="primary" prepend-icon="mdi-refresh" :loading="loading" @click="reload">
            Actualiser
          </v-btn>
          <v-btn variant="tonal" color="primary" to="/admin">Retour au tableau de bord</v-btn>
        </div>
      </template>
    </AgriPageCard>
  </div>
</template>

<script setup lang="ts">
import type { HealthStatus } from '@agrimanage/shared';

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
});

type HistoryEntry = {
  status: HealthStatus['status'];
  timestamp: string;
  latencyMs: number;
};

const api = useApiClient();
const health = ref<HealthStatus | null>(null);
const loading = ref(true);
const error = ref('');
const latencyMs = ref<number | null>(null);
const history = ref<HistoryEntry[]>([]);

onMounted(() => {
  void reload();
});

async function reload() {
  loading.value = true;
  error.value = '';
  const started = performance.now();
  try {
    health.value = await api.getAdminSystemHealth();
    const ms = Math.round(performance.now() - started);
    latencyMs.value = ms;
    history.value = [
      {
        status: health.value.status,
        timestamp: health.value.timestamp,
        latencyMs: ms,
      },
      ...history.value,
    ].slice(0, 8);
  } catch (err) {
    health.value = null;
    latencyMs.value = null;
    error.value = err instanceof Error ? err.message : 'Impossible de vérifier la santé système';
  } finally {
    loading.value = false;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR');
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
</script>
