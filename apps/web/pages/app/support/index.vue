<template>
  <div class="space-y-5 animate-fade-up">
    <div class="support-hero rounded-2xl p-6 text-white shadow-agri">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--agri-wheat)]">
        Assistance
      </p>
      <h1 class="mt-2 font-display text-3xl font-semibold text-white">Centre de support</h1>
      <p class="mt-2 max-w-2xl text-sm text-white/90">
        Décrivez votre besoin clairement : notre équipe vous répond dans les meilleurs délais.
        Suivez l’état de chaque demande en temps réel.
      </p>
    </div>

    <div class="grid gap-5 lg:grid-cols-5">
      <div class="lg:col-span-2">
        <AgriPageCard title="Nouvelle demande" icon="mdi-message-plus-outline">
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-text-field
            v-model="form.name"
            label="Sujet"
            variant="outlined"
            density="comfortable"
            class="mb-2"
            hint="Ex. Problème d’accès à mes stocks"
            persistent-hint
          />
          <v-textarea
            v-model="form.message"
            label="Description détaillée"
            rows="6"
            variant="outlined"
            class="mb-4"
            hint="Contexte, module concerné, étapes déjà essayées"
            persistent-hint
          />
          <v-btn
            color="primary"
            block
            size="large"
            rounded="lg"
            class="font-medium"
            :loading="saving"
            @click="save"
          >
            {{ editingId ? 'Mettre à jour la demande' : 'Envoyer au support' }}
          </v-btn>
          <v-btn
            v-if="editingId"
            class="mt-2"
            block
            variant="text"
            color="agri-muted"
            @click="resetForm"
          >
            Annuler la modification
          </v-btn>
        </AgriPageCard>
      </div>

      <div class="lg:col-span-3">
        <AgriPageCard title="Historique des échanges" icon="mdi-forum-outline">
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              v-for="chip in statusChips"
              :key="chip.value"
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium transition"
              :class="
                statusFilter === chip.value
                  ? 'bg-agri-green text-white'
                  : 'bg-agri-sky text-agri-forest hover:bg-agri-leaf/20'
              "
              @click="statusFilter = chip.value"
            >
              {{ chip.label }}
            </button>
          </div>

          <v-alert v-if="error" type="error" density="comfortable" class="mb-3">{{ error }}</v-alert>

          <div v-if="loading" class="py-10 text-center text-sm text-agri-muted">
            Chargement de vos demandes…
          </div>
          <div
            v-else-if="filteredTickets.length === 0"
            class="rounded-xl border border-dashed border-agri-forest/20 bg-agri-mist/60 py-12 text-center"
          >
            <v-icon size="36" color="success" class="mb-2">mdi-mailbox-outline</v-icon>
            <p class="text-sm text-agri-muted">Aucune demande dans cette catégorie.</p>
          </div>

          <div v-else class="space-y-3 animate-stagger">
            <article
              v-for="ticket in filteredTickets"
              :key="ticket.id"
              class="agri-message-card animate-fade-up p-4"
            >
              <div class="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 class="font-display text-base font-semibold text-agri-forest">
                    {{ ticket.name }}
                  </h2>
                  <p class="text-xs text-agri-muted">{{ formatDate(ticket.createdAt) }}</p>
                </div>
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  :class="statusBadgeClass(ticket.status)"
                >
                  {{ statusLabel(ticket.status) }}
                </span>
              </div>

              <p class="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {{ ticket.message }}
              </p>

              <div v-if="ticket.response" class="agri-response-box mb-3">
                <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
                  Réponse de l’équipe
                </p>
                <p class="whitespace-pre-wrap text-sm">{{ ticket.response }}</p>
                <p v-if="ticket.respondedAt" class="mt-2 text-[11px] text-sky-700/70">
                  {{ formatDate(ticket.respondedAt) }}
                </p>
              </div>

              <div v-if="ticket.status === 'OPEN'" class="flex flex-wrap gap-2">
                <v-btn size="small" color="secondary" variant="tonal" @click="openEdit(ticket)">
                  Modifier
                </v-btn>
                <v-btn size="small" color="error" variant="text" @click="removeTicket(ticket)">
                  Supprimer
                </v-btn>
              </div>
            </article>
          </div>
        </AgriPageCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SupportStatus, type SupportTicketDto } from '@agrimanage/shared';
import { ApiError } from '@agrimanage/api-client';

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const api = useApiClient();
const tickets = ref<SupportTicketDto[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const formError = ref('');
const editingId = ref<string | null>(null);
const statusFilter = ref<'ALL' | SupportStatus>('ALL');
const form = reactive({ name: '', message: '' });

const statusChips = [
  { label: 'Toutes', value: 'ALL' as const },
  { label: 'Ouvertes', value: SupportStatus.OPEN },
  { label: 'En cours', value: SupportStatus.IN_PROGRESS },
  { label: 'Fermées', value: SupportStatus.CLOSED },
];

const filteredTickets = computed(() => {
  if (statusFilter.value === 'ALL') return tickets.value;
  return tickets.value.filter((ticket) => ticket.status === statusFilter.value);
});

onMounted(() => {
  void loadTickets();
});

async function loadTickets() {
  loading.value = true;
  error.value = '';
  try {
    tickets.value = await api.listMyTickets();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Chargement impossible';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.message = '';
  formError.value = '';
}

function openEdit(ticket: SupportTicketDto) {
  editingId.value = ticket.id;
  form.name = ticket.name;
  form.message = ticket.message;
  formError.value = '';
}

async function save() {
  if (!form.name.trim() || !form.message.trim()) {
    formError.value = 'Sujet et message sont obligatoires';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await api.updateTicket(editingId.value, {
        name: form.name.trim(),
        message: form.message.trim(),
      });
    } else {
      await api.createTicket({
        name: form.name.trim(),
        message: form.message.trim(),
      });
    }
    resetForm();
    await loadTickets();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

async function removeTicket(ticket: SupportTicketDto) {
  if (!window.confirm(`Supprimer la demande « ${ticket.name} » ?`)) return;
  try {
    await api.deleteTicket(ticket.id);
    await loadTickets();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  }
}

function statusLabel(status: SupportStatus) {
  if (status === SupportStatus.OPEN) return 'Ouverte';
  if (status === SupportStatus.IN_PROGRESS) return 'En cours';
  return 'Fermée';
}

function statusBadgeClass(status: SupportStatus) {
  if (status === SupportStatus.OPEN) return 'bg-amber-100 text-amber-800';
  if (status === SupportStatus.IN_PROGRESS) return 'bg-sky-100 text-sky-800';
  return 'bg-emerald-100 text-emerald-800';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR');
}
</script>

<style scoped>
.support-hero {
  background: linear-gradient(90deg, var(--agri-forest), var(--agri-green));
  border: 1px solid rgba(255, 255, 255, 0.12);
}
</style>
