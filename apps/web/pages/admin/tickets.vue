<template>
  <div>
    <AgriPageCard title="Requêtes des utilisateurs" icon="mdi-inbox">
      <div class="mb-4 flex flex-wrap items-end gap-3">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          label="Filtrer par statut"
          clearable
          density="comfortable"
          variant="outlined"
          hide-details
          class="max-w-xs grow"
          @update:model-value="loadTickets"
        />
        <v-text-field
          v-model="search"
          label="Rechercher (nom, email, message)"
          prepend-inner-icon="mdi-magnify"
          clearable
          density="comfortable"
          variant="outlined"
          hide-details
          class="min-w-[220px] grow"
        />
        <v-btn
          variant="tonal"
          color="primary"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="loadTickets"
        >
          Actualiser
        </v-btn>
      </div>

      <v-alert v-if="error" type="error" density="comfortable" class="mb-3">{{ error }}</v-alert>
      <v-alert v-if="success" type="success" density="comfortable" class="mb-3" closable @click:close="success = ''">
        {{ success }}
      </v-alert>

      <div v-if="loading" class="pa-8 text-center text-medium-emphasis">Chargement…</div>

      <v-alert
        v-else-if="filteredTickets.length === 0"
        type="info"
        variant="tonal"
        density="comfortable"
        class="mb-2"
      >
        {{ tickets.length === 0 ? 'Aucune demande pour le moment.' : 'Aucun ticket ne correspond à votre recherche.' }}
      </v-alert>

      <div v-else class="overflow-x-auto">
        <v-table class="agri-table elevation-1">
          <thead>
            <tr>
              <th class="text-left">Demandeur</th>
              <th class="text-left">Message</th>
              <th class="text-left">Statut</th>
              <th class="text-left">Date</th>
              <th class="agri-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ticket in filteredTickets"
              :key="ticket.id"
              :class="{ 'bg-[color:var(--agri-mist)]': selected?.id === ticket.id }"
            >
              <td>
                <p class="font-medium">{{ ticket.name }}</p>
                <p class="text-caption text-medium-emphasis">{{ ticket.email }}</p>
              </td>
              <td class="max-w-xs">
                <p class="line-clamp-2 text-sm">{{ ticket.message }}</p>
              </td>
              <td>
                <v-chip size="small" :color="statusColor(ticket.status)" variant="tonal">
                  {{ statusLabel(ticket.status) }}
                </v-chip>
              </td>
              <td class="whitespace-nowrap text-sm">{{ formatDate(ticket.createdAt) }}</td>
              <td class="agri-col-actions">
                <div class="agri-fab-actions">
                  <IconAction icon="mdi-eye" label="Détail" color="info" @click="openDetail(ticket)" />
                  <IconAction
                    v-if="ticket.status !== SupportStatus.CLOSED"
                    icon="mdi-reply"
                    label="Répondre"
                    color="primary"
                    @click="openRespond(ticket)"
                  />
                  <IconAction
                    icon="mdi-delete"
                    label="Supprimer"
                    color="error"
                    @click="removeTicket(ticket)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </AgriPageCard>

    <v-navigation-drawer
      v-model="detailOpen"
      location="right"
      temporary
      width="420"
      class="admin-ticket-drawer"
    >
      <div v-if="selected" class="flex h-full flex-col">
        <div class="border-b border-[color:var(--agri-border)] p-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-[color:var(--agri-muted)]">
                Détail ticket
              </p>
              <h2 class="mt-1 font-display text-lg text-[color:var(--agri-forest)]">
                {{ selected.name }}
              </h2>
              <p class="text-sm text-[color:var(--agri-muted)]">{{ selected.email }}</p>
            </div>
            <v-btn icon="mdi-close" variant="text" size="small" @click="detailOpen = false" />
          </div>
          <v-chip class="mt-3" size="small" :color="statusColor(selected.status)" variant="tonal">
            {{ statusLabel(selected.status) }}
          </v-chip>
        </div>

        <div class="grow space-y-4 overflow-y-auto p-4">
          <div>
            <p class="mb-1 text-xs font-semibold uppercase text-[color:var(--agri-muted)]">Message</p>
            <p class="whitespace-pre-wrap rounded-lg border border-[color:var(--agri-border)] bg-white p-3 text-sm">
              {{ selected.message }}
            </p>
          </div>
          <div v-if="selected.response">
            <p class="mb-1 text-xs font-semibold uppercase text-[color:var(--agri-muted)]">Réponse</p>
            <div class="agri-response-box text-sm">{{ selected.response }}</div>
          </div>
          <div class="text-xs text-[color:var(--agri-muted)]">
            Créé le {{ formatDate(selected.createdAt) }}
            <span v-if="selected.respondedAt">
              · Répondu le {{ formatDate(selected.respondedAt) }}
            </span>
          </div>
        </div>

        <div class="space-y-2 border-t border-[color:var(--agri-border)] p-4">
          <v-btn
            v-if="selected.status !== SupportStatus.CLOSED"
            color="primary"
            block
            prepend-icon="mdi-reply"
            @click="openRespond(selected)"
          >
            Répondre
          </v-btn>
          <v-btn
            v-if="selected.status === SupportStatus.OPEN"
            variant="tonal"
            color="info"
            block
            :loading="statusLoading"
            @click="setStatus(selected, SupportStatus.IN_PROGRESS)"
          >
            Marquer en cours
          </v-btn>
          <v-btn
            v-if="selected.status !== SupportStatus.CLOSED"
            variant="tonal"
            color="success"
            block
            :loading="statusLoading"
            @click="setStatus(selected, SupportStatus.CLOSED)"
          >
            Fermer le ticket
          </v-btn>
          <v-btn variant="text" color="error" block @click="removeTicket(selected)">
            Supprimer
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <v-dialog v-model="dialog" max-width="520">
      <v-card class="pa-4">
        <v-card-title>Répondre à {{ selected?.name }}</v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-textarea v-model="response" label="Réponse" rows="4" class="mb-2" auto-grow />
          <v-select
            v-model="responseStatus"
            :items="respondStatusOptions"
            item-title="title"
            item-value="value"
            label="Statut après réponse"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Annuler</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveRespond">Envoyer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { SupportStatus, type SupportTicketDto } from '@agrimanage/shared';
import { ApiError } from '@agrimanage/api-client';

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
});

const route = useRoute();
const api = useApiClient();
const tickets = ref<SupportTicketDto[]>([]);
const loading = ref(true);
const saving = ref(false);
const statusLoading = ref(false);
const error = ref('');
const success = ref('');
const formError = ref('');
const search = ref('');
const statusFilter = ref<SupportStatus | null>(null);
const dialog = ref(false);
const detailOpen = ref(false);
const selected = ref<SupportTicketDto | null>(null);
const response = ref('');
const responseStatus = ref(SupportStatus.CLOSED);

const statusOptions = [
  { title: 'Ouvertes', value: SupportStatus.OPEN },
  { title: 'En cours', value: SupportStatus.IN_PROGRESS },
  { title: 'Fermées', value: SupportStatus.CLOSED },
];

const respondStatusOptions = [
  { title: 'En cours', value: SupportStatus.IN_PROGRESS },
  { title: 'Fermée', value: SupportStatus.CLOSED },
];

const filteredTickets = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return tickets.value;
  return tickets.value.filter((ticket) =>
    [ticket.name, ticket.email, ticket.message, ticket.response ?? '']
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
});

onMounted(() => {
  void loadTickets();
});

watch(
  () => route.query.focus,
  (focusId) => {
    if (typeof focusId === 'string' && tickets.value.length) {
      const ticket = tickets.value.find((item) => item.id === focusId);
      if (ticket) openDetail(ticket);
    }
  },
);

async function loadTickets() {
  loading.value = true;
  error.value = '';
  try {
    tickets.value = await api.listAdminTickets(statusFilter.value || undefined);
    const focusId = route.query.focus;
    if (typeof focusId === 'string') {
      const ticket = tickets.value.find((item) => item.id === focusId);
      if (ticket) openDetail(ticket);
    } else if (selected.value) {
      selected.value = tickets.value.find((item) => item.id === selected.value?.id) ?? null;
    }
  } catch (err) {
    tickets.value = [];
    error.value = err instanceof Error ? err.message : 'Chargement impossible';
  } finally {
    loading.value = false;
  }
}

function openDetail(ticket: SupportTicketDto) {
  selected.value = ticket;
  detailOpen.value = true;
}

function openRespond(ticket: SupportTicketDto) {
  selected.value = ticket;
  response.value = ticket.response ?? '';
  responseStatus.value = SupportStatus.CLOSED;
  formError.value = '';
  dialog.value = true;
}

async function saveRespond() {
  if (!selected.value || !response.value.trim()) {
    formError.value = 'La réponse est obligatoire';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    await api.respondToTicket(selected.value.id, {
      response: response.value.trim(),
      status: responseStatus.value,
    });
    dialog.value = false;
    success.value = 'Réponse envoyée.';
    await loadTickets();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

async function setStatus(ticket: SupportTicketDto, status: SupportStatus) {
  const confirmClose =
    status === SupportStatus.CLOSED
      ? window.confirm(`Fermer la demande de « ${ticket.name} » ?`)
      : true;
  if (!confirmClose) return;

  statusLoading.value = true;
  error.value = '';
  try {
    await api.updateAdminTicketStatus(ticket.id, status);
    success.value =
      status === SupportStatus.CLOSED ? 'Ticket fermé.' : 'Ticket marqué en cours.';
    await loadTickets();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Mise à jour impossible';
  } finally {
    statusLoading.value = false;
  }
}

async function removeTicket(ticket: SupportTicketDto) {
  if (!window.confirm(`Supprimer définitivement la demande de « ${ticket.name} » ?`)) return;
  try {
    await api.deleteAdminTicket(ticket.id);
    if (selected.value?.id === ticket.id) {
      detailOpen.value = false;
      selected.value = null;
    }
    success.value = 'Ticket supprimé.';
    await loadTickets();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  }
}

function statusLabel(status: SupportStatus) {
  return statusOptions.find((item) => item.value === status)?.title ?? status;
}

function statusColor(status: SupportStatus) {
  if (status === SupportStatus.OPEN) return 'warning';
  if (status === SupportStatus.IN_PROGRESS) return 'info';
  return 'success';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR');
}
</script>
