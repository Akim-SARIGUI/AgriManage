<template>
  <div>
    <v-alert v-if="error" type="error" density="comfortable" class="mb-4">{{ error }}</v-alert>

    <AgriPageCard
      title="Suivi des Cultures"
      icon="mdi-leaf"
      subtitle="Suivez vos cultures par parcelle"
    >
      <v-select
        v-model="filterParcelId"
        :items="parcelOptions"
        item-title="title"
        item-value="value"
        label="Filtrer par parcelle"
        clearable
        density="comfortable"
        outlined
        class="mb-4 max-w-md"
        @update:model-value="loadCrops"
      />

      <v-alert v-if="parcels.length === 0 && !loading" type="info" density="comfortable" class="mb-4">
        Créez d’abord une parcelle avant d’ajouter une culture.
        <NuxtLink to="/app/parcels" class="ml-2 font-medium text-primary">Aller aux parcelles</NuxtLink>
      </v-alert>

      <div v-if="loading" class="pa-8 text-center text-medium-emphasis">Chargement des cultures…</div>

      <div v-else-if="crops.length === 0" class="pa-8 text-center text-medium-emphasis">
        Aucune culture pour le moment.
      </div>

      <v-table v-else class="agri-table elevation-1">
        <thead>
          <tr>
            <th class="text-left">Culture</th>
            <th class="text-left">Parcelle</th>
            <th class="text-left">Plantation</th>
            <th class="text-left">Récolte prévue</th>
            <th class="agri-col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="crop in crops" :key="crop.id">
            <td>
              <NuxtLink :to="`/app/crops/${crop.id}`" class="font-medium text-primary">
                {{ crop.name }}
              </NuxtLink>
            </td>
            <td>{{ crop.parcelName ?? '—' }}</td>
            <td>{{ formatDate(crop.plantingDate) }}</td>
            <td>{{ formatDate(crop.harvestDate) }}</td>
            <td class="agri-col-actions">
              <div class="agri-fab-actions">
              <IconAction
                icon="mdi-eye"
                label="Voir le détail"
                color="info"
                :to="`/app/crops/${crop.id}`"
              />
              <IconAction
                icon="mdi-pencil"
                label="Modifier"
                color="secondary"
                @click="openEdit(crop)"
              />
              <IconAction
                icon="mdi-delete"
                label="Supprimer"
                color="error"
                :loading="deletingId === crop.id"
                @click="confirmDelete(crop)"
              />
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          elevation="2"
          :disabled="parcels.length === 0"
          @click="openCreate"
        >
          Ajouter une Culture
        </v-btn>
      </template>
    </AgriPageCard>

    <v-dialog v-model="dialog" persistent max-width="520">
      <v-card>
        <v-card-title class="agri-dialog-title">
          {{ editingId ? 'Modifier la culture' : 'Nouvelle culture' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-select
            v-model="form.parcelId"
            :items="parcelSelectItems"
            item-title="title"
            item-value="value"
            label="Parcelle"
            required
            outlined
            class="mb-2"
          />
          <v-text-field v-model="form.name" label="Nom de la culture" required outlined class="mb-2" />
          <v-text-field
            v-model="form.plantingDate"
            label="Date de plantation"
            type="date"
            outlined
            class="mb-2"
          />
          <v-text-field v-model="form.harvestDate" label="Date de récolte prévue" type="date" outlined />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" :loading="saving" @click="save">Enregistrer</v-btn>
          <v-btn color="error" variant="text" @click="dialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { CropDto, ParcelDto } from '@agrimanage/shared';
import { ApiError } from '@agrimanage/api-client';

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const route = useRoute();
const api = useApiClient();
const crops = ref<CropDto[]>([]);
const parcels = ref<ParcelDto[]>([]);
const filterParcelId = ref<string | null>(null);
const loading = ref(true);
const saving = ref(false);
const deletingId = ref<string | null>(null);
const error = ref('');
const formError = ref('');
const dialog = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  parcelId: '',
  name: '',
  plantingDate: '',
  harvestDate: '',
});

const parcelOptions = computed(() =>
  parcels.value.map((parcel) => ({ title: parcel.name, value: parcel.id })),
);

const parcelSelectItems = computed(() => parcelOptions.value);

onMounted(async () => {
  const queryParcel = route.query.parcelId;
  if (typeof queryParcel === 'string' && queryParcel) {
    filterParcelId.value = queryParcel;
  }
  await loadParcels();
  await loadCrops();
});

async function loadParcels() {
  try {
    parcels.value = await api.listParcels();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Impossible de charger les parcelles';
  }
}

async function loadCrops() {
  loading.value = true;
  error.value = '';
  try {
    crops.value = await api.listCrops(filterParcelId.value || undefined);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Impossible de charger les cultures';
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.parcelId = filterParcelId.value || parcels.value[0]?.id || '';
  form.name = '';
  form.plantingDate = '';
  form.harvestDate = '';
  formError.value = '';
  dialog.value = true;
}

function openEdit(crop: CropDto) {
  editingId.value = crop.id;
  form.parcelId = crop.parcelId;
  form.name = crop.name;
  form.plantingDate = toDateInput(crop.plantingDate);
  form.harvestDate = toDateInput(crop.harvestDate);
  formError.value = '';
  dialog.value = true;
}

async function save() {
  if (!form.parcelId || !form.name.trim()) {
    formError.value = 'Parcelle et nom sont obligatoires';
    return;
  }

  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      parcelId: form.parcelId,
      name: form.name.trim(),
      ...(form.plantingDate ? { plantingDate: new Date(form.plantingDate).toISOString() } : {}),
      ...(form.harvestDate ? { harvestDate: new Date(form.harvestDate).toISOString() } : {}),
    };

    if (editingId.value) {
      await api.updateCrop(editingId.value, {
        ...payload,
        plantingDate: form.plantingDate
          ? new Date(form.plantingDate).toISOString()
          : null,
        harvestDate: form.harvestDate ? new Date(form.harvestDate).toISOString() : null,
      });
    } else {
      await api.createCrop(payload);
    }

    dialog.value = false;
    await loadCrops();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(crop: CropDto) {
  if (!window.confirm(`Supprimer la culture « ${crop.name} » et ses activités ?`)) {
    return;
  }
  deletingId.value = crop.id;
  try {
    await api.deleteCrop(crop.id);
    await loadCrops();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  } finally {
    deletingId.value = null;
  }
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

function toDateInput(value: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}
</script>
