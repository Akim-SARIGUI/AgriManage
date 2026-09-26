<template>
  <div>
    <v-alert v-if="error" type="error" density="comfortable" class="mb-4">{{ error }}</v-alert>

    <AgriPageCard
      title="Carte des parcelles"
      icon="mdi-map-marker-radius"
      subtitle="Visualisez toutes vos parcelles géolocalisées"
    >
      <template #title-actions>
        <v-btn size="small" variant="text" color="white" to="/app/parcels">
          Retour aux parcelles
        </v-btn>
      </template>

      <v-alert
        v-if="!loading && markers.length === 0"
        type="info"
        density="comfortable"
        class="mb-4"
      >
        Aucune parcelle n’a encore de coordonnées. Éditez une parcelle et cliquez sur la carte pour
        la localiser.
      </v-alert>

      <ClientOnly>
        <ParcelMap
          v-if="!loading"
          :markers="markers"
          height="520px"
          :zoom="12"
        />
        <div v-else class="pa-10 text-center text-medium-emphasis">Chargement de la carte…</div>
      </ClientOnly>

      <v-list v-if="markers.length" class="mt-4 rounded elevation-1">
        <v-list-item
          v-for="marker in markers"
          :key="marker.id"
          :title="marker.name"
          :subtitle="`${marker.latitude}, ${marker.longitude}`"
          prepend-icon="mdi-map-marker"
        />
      </v-list>
    </AgriPageCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const api = useApiClient();
const loading = ref(true);
const error = ref('');
const markers = ref<Array<{ id: string; name: string; latitude: number; longitude: number }>>(
  [],
);

onMounted(async () => {
  loading.value = true;
  try {
    const parcels = await api.listParcels();
    markers.value = parcels
      .filter((parcel) => parcel.latitude != null && parcel.longitude != null)
      .map((parcel) => ({
        id: parcel.id,
        name: parcel.locationLabel
          ? `${parcel.name} (${parcel.locationLabel})`
          : parcel.name,
        latitude: parcel.latitude!,
        longitude: parcel.longitude!,
      }));
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Impossible de charger la carte';
  } finally {
    loading.value = false;
  }
});
</script>
