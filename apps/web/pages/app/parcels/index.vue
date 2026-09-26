<template>
  <div>
    <v-alert v-if="error" type="error" density="comfortable" class="mb-4">{{ error }}</v-alert>

    <AgriPageCard title="Gestion des Parcelles" icon="mdi-map" subtitle="Terres, surfaces et localisation">
      <template #title-actions>
        <v-btn size="small" variant="text" color="white" to="/app/map" prepend-icon="mdi-map-marker">
          Carte
        </v-btn>
      </template>

      <div v-if="loading" class="pa-8 text-center text-medium-emphasis">Chargement des parcelles…</div>

      <div v-else-if="parcels.length === 0" class="pa-8 text-center">
        <p class="mb-4 text-medium-emphasis">Pas de parcelle</p>
      </div>

      <v-table v-else class="agri-table elevation-1">
        <thead>
          <tr>
            <th class="text-left">Nom</th>
            <th class="text-left">Surface (ha)</th>
            <th class="text-left">Localisation</th>
            <th class="text-left">Cultures</th>
            <th class="text-left">Créée le</th>
            <th class="agri-col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="parcel in parcels" :key="parcel.id">
            <td class="font-medium">{{ parcel.name }}</td>
            <td>{{ parcel.size != null ? `${parcel.size} ha` : '—' }}</td>
            <td>
              <span v-if="parcel.latitude != null && parcel.longitude != null">
                {{ parcel.locationLabel || `${parcel.latitude}, ${parcel.longitude}` }}
              </span>
              <span v-else class="text-medium-emphasis">Non définie</span>
            </td>
            <td>
              <v-chip size="small" color="success" variant="tonal" @click="openCrops(parcel)">
                {{ cropsByParcel(parcel.id).length }}
              </v-chip>
            </td>
            <td>{{ formatDate(parcel.createdAt) }}</td>
            <td class="agri-col-actions">
              <div class="agri-fab-actions">
              <IconAction
                v-if="parcel.latitude != null"
                icon="mdi-map-marker"
                label="Voir sur la carte"
                color="success"
                @click="openMapView(parcel)"
              />
              <IconAction
                icon="mdi-history"
                label="Cultures liées"
                color="info"
                @click="openCrops(parcel)"
              />
              <IconAction
                icon="mdi-pencil"
                label="Modifier"
                color="secondary"
                @click="openEdit(parcel)"
              />
              <IconAction
                icon="mdi-delete"
                label="Supprimer"
                color="error"
                :loading="deletingId === parcel.id"
                @click="confirmDelete(parcel)"
              />
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" elevation="2" @click="openCreate">
          Ajouter une Parcelle
        </v-btn>
      </template>
    </AgriPageCard>

    <v-dialog v-model="dialog" persistent max-width="720">
      <v-card>
        <v-card-title class="agri-dialog-title">
          {{ editingId ? 'Modifier Parcelle' : 'Créer Parcelle' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-text-field v-model="form.name" label="Nom de la Parcelle" required outlined class="mb-2" />
          <v-text-field
            v-model.number="form.size"
            label="Taille (en hectares)"
            type="number"
            min="0"
            step="0.01"
            outlined
            class="mb-2"
          />
          <v-text-field
            v-model="form.locationLabel"
            label="Libellé de localisation (optionnel)"
            outlined
            class="mb-2"
          />
          <p class="mb-2 text-sm text-medium-emphasis">
            Cliquez sur la carte pour placer la parcelle
            <v-btn size="x-small" variant="text" class="ml-1" :loading="geoLoading" @click="useMyPosition">
              Ma position
            </v-btn>
          </p>
          <ClientOnly>
            <ParcelMap
              :selectable="true"
              :selected="
                form.latitude != null && form.longitude != null
                  ? { latitude: form.latitude, longitude: form.longitude }
                  : null
              "
              height="280px"
              @select="onMapSelect"
            />
          </ClientOnly>
          <p v-if="form.latitude != null" class="mt-2 text-xs text-medium-emphasis">
            Coordonnées : {{ form.latitude }}, {{ form.longitude }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" :loading="saving" @click="save">Enregistrer</v-btn>
          <v-btn color="error" variant="text" @click="dialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="mapDialog" max-width="900">
      <v-card v-if="mapParcel">
        <v-card-title class="agri-dialog-title">Localisation — {{ mapParcel.name }}</v-card-title>
        <v-card-text class="pt-4">
          <ClientOnly>
            <ParcelMap
              :markers="[
                {
                  id: mapParcel.id,
                  name: mapParcel.name,
                  latitude: mapParcel.latitude!,
                  longitude: mapParcel.longitude!,
                },
              ]"
              height="400px"
              :zoom="14"
            />
          </ClientOnly>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="mapDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="cropsDialog" max-width="560">
      <v-card v-if="cropsParcel">
        <v-card-title class="agri-dialog-title">Cultures — {{ cropsParcel.name }}</v-card-title>
        <v-card-text class="pt-4">
          <p v-if="cropsByParcel(cropsParcel.id).length === 0" class="text-medium-emphasis">
            Aucune culture liée à cette parcelle.
          </p>
          <v-list v-else density="comfortable">
            <v-list-item
              v-for="crop in cropsByParcel(cropsParcel.id)"
              :key="crop.id"
              :title="crop.name"
              :subtitle="cropSubtitle(crop)"
              :to="`/app/crops/${crop.id}`"
              append-icon="mdi-chevron-right"
            />
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" variant="tonal" :to="`/app/crops?parcelId=${cropsParcel.id}`">
            Voir / ajouter des cultures
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="cropsDialog = false">Fermer</v-btn>
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

const api = useApiClient();
const parcels = ref<ParcelDto[]>([]);
const crops = ref<CropDto[]>([]);
const loading = ref(true);
const saving = ref(false);
const geoLoading = ref(false);
const deletingId = ref<string | null>(null);
const error = ref('');
const formError = ref('');
const dialog = ref(false);
const mapDialog = ref(false);
const mapParcel = ref<ParcelDto | null>(null);
const cropsDialog = ref(false);
const cropsParcel = ref<ParcelDto | null>(null);
const editingId = ref<string | null>(null);
const form = reactive<{
  name: string;
  size: number | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string;
}>({
  name: '',
  size: null,
  latitude: null,
  longitude: null,
  locationLabel: '',
});

onMounted(() => {
  void loadParcels();
});

async function loadParcels() {
  loading.value = true;
  error.value = '';
  try {
    const [parcelList, cropList] = await Promise.all([api.listParcels(), api.listCrops()]);
    parcels.value = parcelList;
    crops.value = cropList;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Impossible de charger les parcelles';
  } finally {
    loading.value = false;
  }
}

function cropsByParcel(parcelId: string) {
  return crops.value.filter((crop) => crop.parcelId === parcelId);
}

function cropSubtitle(crop: CropDto) {
  const planted = crop.plantingDate
    ? `Plantée le ${new Date(crop.plantingDate).toLocaleDateString('fr-FR')}`
    : 'Date de plantation non définie';
  return planted;
}

function openCrops(parcel: ParcelDto) {
  cropsParcel.value = parcel;
  cropsDialog.value = true;
}

function openCreate() {
  editingId.value = null;
  form.name = '';
  form.size = null;
  form.latitude = null;
  form.longitude = null;
  form.locationLabel = '';
  formError.value = '';
  dialog.value = true;
}

function openEdit(parcel: ParcelDto) {
  editingId.value = parcel.id;
  form.name = parcel.name;
  form.size = parcel.size;
  form.latitude = parcel.latitude;
  form.longitude = parcel.longitude;
  form.locationLabel = parcel.locationLabel ?? '';
  formError.value = '';
  dialog.value = true;
}

function openMapView(parcel: ParcelDto) {
  mapParcel.value = parcel;
  mapDialog.value = true;
}

function onMapSelect(payload: { latitude: number; longitude: number }) {
  form.latitude = payload.latitude;
  form.longitude = payload.longitude;
}

function useMyPosition() {
  if (!navigator.geolocation) {
    formError.value = 'Géolocalisation indisponible';
    return;
  }
  geoLoading.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.latitude = Number(position.coords.latitude.toFixed(6));
      form.longitude = Number(position.coords.longitude.toFixed(6));
      if (!form.locationLabel) form.locationLabel = 'Ma position';
      geoLoading.value = false;
    },
    () => {
      formError.value = 'Impossible d’obtenir votre position';
      geoLoading.value = false;
    },
  );
}

async function save() {
  if (!form.name.trim()) {
    formError.value = 'Le nom est obligatoire';
    return;
  }

  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      name: form.name.trim(),
      size:
        form.size === null || form.size === undefined || Number.isNaN(Number(form.size))
          ? null
          : Number(form.size),
      latitude: form.latitude,
      longitude: form.longitude,
      locationLabel: form.locationLabel.trim() || null,
    };

    if (editingId.value) {
      await api.updateParcel(editingId.value, payload);
    } else {
      await api.createParcel({
        name: payload.name,
        ...(payload.size != null ? { size: payload.size } : {}),
        ...(payload.latitude != null ? { latitude: payload.latitude } : {}),
        ...(payload.longitude != null ? { longitude: payload.longitude } : {}),
        ...(payload.locationLabel ? { locationLabel: payload.locationLabel } : {}),
      });
    }

    dialog.value = false;
    await loadParcels();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(parcel: ParcelDto) {
  if (!window.confirm(`Supprimer la parcelle « ${parcel.name} » ?`)) return;
  deletingId.value = parcel.id;
  try {
    await api.deleteParcel(parcel.id);
    await loadParcels();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  } finally {
    deletingId.value = null;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR');
}
</script>
