<template>
  <div>
    <v-btn class="mb-4" variant="text" color="primary" prepend-icon="mdi-arrow-left" to="/app/crops">
      Retour
    </v-btn>

    <v-alert v-if="error" type="error" density="comfortable" class="mb-4">{{ error }}</v-alert>

    <div v-if="loading || !crop" class="pa-8 text-center">
      <v-card class="agri-page-card pa-8 elevation-4">Chargement…</v-card>
    </div>

    <template v-else>
      <AgriPageCard
        :title="crop.name"
        icon="mdi-leaf"
        :subtitle="`Parcelle : ${crop.parcelName ?? '—'}`"
      >
        <template #title-actions>
          <v-btn
            size="small"
            variant="text"
            color="white"
            prepend-icon="mdi-plus"
            @click="openActivityCreate"
          >
            Activité
          </v-btn>
        </template>

        <p class="mb-4 text-body-2 text-medium-emphasis">
          Plantation : {{ formatDate(crop.plantingDate) }} · Récolte :
          {{ formatDate(crop.harvestDate) }}
        </p>

        <div v-if="crop.activities.length === 0" class="pa-6 text-center text-medium-emphasis">
          Aucune activité enregistrée pour cette culture.
        </div>

        <div v-else class="space-y-3">
          <v-card v-for="activity in crop.activities" :key="activity.id" class="pa-4" elevation="2">
            <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-subtitle-1 font-weight-bold">{{ activity.name }}</h2>
                <p class="text-sm text-medium-emphasis">
                  {{ formatDate(activity.date) }}
                  <span v-if="activity.details"> · {{ activity.details }}</span>
                </p>
              </div>
              <div class="agri-fab-actions">
                <IconAction
                  icon="mdi-note-plus"
                  label="Ajouter une intervention"
                  color="info"
                  @click="openIntervention(activity.id)"
                />
                <IconAction
                  icon="mdi-pencil"
                  label="Modifier l’activité"
                  color="secondary"
                  @click="openActivityEdit(activity)"
                />
                <IconAction
                  icon="mdi-delete"
                  label="Supprimer l’activité"
                  color="error"
                  @click="removeActivity(activity.id, activity.name)"
                />
              </div>
            </div>

            <div v-if="activity.interventions?.length" class="space-y-2 border-t border-black/5 pt-3">
              <p class="mb-2 text-sm font-medium">Interventions</p>
              <div
                v-for="item in activity.interventions"
                :key="item.id"
                class="flex items-center justify-between rounded px-3 py-2 text-sm"
                style="background: #e8f5e9"
              >
                <span>
                  {{ item.note || 'Intervention sans note' }}
                  <span class="text-medium-emphasis"> · {{ formatDate(item.createdAt) }}</span>
                </span>
                <v-btn
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="removeIntervention(item.id)"
                />
              </div>
            </div>
          </v-card>
        </div>
      </AgriPageCard>
    </template>

    <v-dialog v-model="activityDialog" persistent max-width="480">
      <v-card>
        <v-card-title class="agri-dialog-title">
          {{ editingActivityId ? 'Modifier l’activité' : 'Nouvelle activité' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-text-field v-model="activityForm.name" label="Nom" required outlined class="mb-2" />
          <v-text-field v-model="activityForm.date" label="Date" type="date" outlined class="mb-2" />
          <v-textarea v-model="activityForm.details" label="Détails" rows="3" outlined />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" :loading="saving" @click="saveActivity">
            Enregistrer
          </v-btn>
          <v-btn color="error" variant="text" @click="activityDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="interventionDialog" persistent max-width="420">
      <v-card>
        <v-card-title class="agri-dialog-title">Nouvelle intervention</v-card-title>
        <v-card-text class="pt-4">
          <v-textarea v-model="interventionNote" label="Note (optionnel)" rows="3" outlined />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" :loading="saving" @click="saveIntervention">
            Ajouter
          </v-btn>
          <v-btn color="error" variant="text" @click="interventionDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { ActivityDto, CropDetailDto } from '@agrimanage/shared';
import { ApiError } from '@agrimanage/api-client';

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const route = useRoute();
const api = useApiClient();
const cropId = computed(() => String(route.params.id));

const crop = ref<CropDetailDto | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const formError = ref('');

const activityDialog = ref(false);
const editingActivityId = ref<string | null>(null);
const activityForm = reactive({ name: '', date: '', details: '' });

const interventionDialog = ref(false);
const interventionActivityId = ref<string | null>(null);
const interventionNote = ref('');

onMounted(() => {
  void loadCrop();
});

async function loadCrop() {
  loading.value = true;
  error.value = '';
  try {
    crop.value = await api.getCrop(cropId.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Culture introuvable';
    crop.value = null;
  } finally {
    loading.value = false;
  }
}

function openActivityCreate() {
  editingActivityId.value = null;
  activityForm.name = '';
  activityForm.date = '';
  activityForm.details = '';
  formError.value = '';
  activityDialog.value = true;
}

function openActivityEdit(activity: ActivityDto) {
  editingActivityId.value = activity.id;
  activityForm.name = activity.name;
  activityForm.date = activity.date ? new Date(activity.date).toISOString().slice(0, 10) : '';
  activityForm.details = activity.details ?? '';
  formError.value = '';
  activityDialog.value = true;
}

async function saveActivity() {
  if (!activityForm.name.trim()) {
    formError.value = 'Le nom est obligatoire';
    return;
  }

  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      name: activityForm.name.trim(),
      ...(activityForm.date ? { date: new Date(activityForm.date).toISOString() } : {}),
      ...(activityForm.details.trim() ? { details: activityForm.details.trim() } : {}),
    };

    if (editingActivityId.value) {
      await api.updateActivity(editingActivityId.value, {
        name: payload.name,
        date: activityForm.date ? new Date(activityForm.date).toISOString() : null,
        details: activityForm.details.trim() || null,
      });
    } else {
      await api.createActivity(cropId.value, payload);
    }

    activityDialog.value = false;
    await loadCrop();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

async function removeActivity(id: string, name: string) {
  if (!window.confirm(`Supprimer l’activité « ${name} » ?`)) return;
  try {
    await api.deleteActivity(id);
    await loadCrop();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  }
}

function openIntervention(activityId: string) {
  interventionActivityId.value = activityId;
  interventionNote.value = '';
  interventionDialog.value = true;
}

async function saveIntervention() {
  if (!interventionActivityId.value) return;
  saving.value = true;
  try {
    await api.createIntervention(interventionActivityId.value, {
      note: interventionNote.value.trim() || undefined,
    });
    interventionDialog.value = false;
    await loadCrop();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur intervention';
  } finally {
    saving.value = false;
  }
}

async function removeIntervention(id: string) {
  try {
    await api.deleteIntervention(id);
    await loadCrop();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  }
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}
</script>
