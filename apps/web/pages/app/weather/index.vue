<template>
  <div>
    <AgriPageCard
      title="Prévisions Météorologiques"
      icon="mdi-weather-cloudy"
      subtitle="Prévisions 7 jours pour décider arrosage et traitements"
    >
      <template #title-actions>
        <v-btn
          size="small"
          variant="text"
          color="white"
          prepend-icon="mdi-crosshairs-gps"
          :loading="geoLoading"
          @click="useGeolocation"
        >
          Ma position
        </v-btn>
      </template>

      <div class="mb-4 flex flex-wrap gap-3">
        <v-text-field
          v-model="searchQuery"
          label="Rechercher une ville"
          density="comfortable"
          hide-details
          outlined
          class="min-w-[240px] max-w-md flex-1"
          @keyup.enter="searchLocations"
        />
        <v-btn color="primary" :loading="searchLoading" @click="searchLocations">
          Chercher
        </v-btn>
      </div>

      <v-list v-if="locations.length" class="mb-4 rounded elevation-1" density="compact">
        <v-list-item
          v-for="location in locations"
          :key="location.id"
          :title="location.name"
          :subtitle="[location.admin1, location.country].filter(Boolean).join(', ')"
          @click="selectLocation(location)"
        />
      </v-list>

      <v-alert v-if="error" type="error" density="comfortable" class="mb-3">{{ error }}</v-alert>
      <v-alert v-if="hint" type="info" density="comfortable" class="mb-3">{{ hint }}</v-alert>

      <div v-if="loading" class="pa-8 text-center text-medium-emphasis">
        Chargement des prévisions…
      </div>

      <template v-else-if="forecast">
        <p class="mb-4 text-sm text-medium-emphasis">
          {{ forecast.locationName || 'Position sélectionnée' }}
          · {{ forecast.latitude.toFixed(2) }}, {{ forecast.longitude.toFixed(2) }}
          · {{ forecast.timezone }}
        </p>

        <h3 class="mb-3 text-subtitle-1 font-weight-bold text-primary">Conditions actuelles</h3>
        <v-row class="mb-4">
          <v-col
            v-for="(day, index) in forecast.days.slice(0, 3)"
            :key="day.date"
            cols="12"
            md="4"
          >
            <v-card
              class="pa-4 h-100"
              :color="index === 0 ? 'primary' : undefined"
              :variant="index === 0 ? 'flat' : 'outlined'"
              elevation="2"
            >
              <p class="mb-1 text-sm opacity-80">{{ formatDay(day.date) }}</p>
              <p class="mb-2 text-lg font-semibold">{{ day.weatherLabel }}</p>
              <p class="text-sm">Max {{ day.tempMax }}°C · Min {{ day.tempMin }}°C</p>
              <p class="text-sm">Pluie {{ day.precipitation }} mm</p>
              <p v-if="day.windSpeedMax != null" class="text-sm">Vent {{ day.windSpeedMax }} km/h</p>
              <p v-if="day.precipitation >= 5" class="mt-2 text-xs font-medium">
                Conseil : éviter traitements si pluie prévue.
              </p>
              <p v-else-if="day.tempMax >= 32" class="mt-2 text-xs font-medium">
                Conseil : surveiller le stress hydrique.
              </p>
            </v-card>
          </v-col>
        </v-row>

        <h3 class="mb-3 text-subtitle-1 font-weight-bold text-primary">Jours suivants</h3>
        <v-table class="agri-table elevation-1">
          <thead>
            <tr>
              <th class="text-left">Jour</th>
              <th class="text-left">Météo</th>
              <th class="text-left">Températures</th>
              <th class="text-left">Pluie</th>
              <th class="text-left">Vent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in forecast.days.slice(3)" :key="day.date">
              <td>{{ formatDay(day.date) }}</td>
              <td>{{ day.weatherLabel }}</td>
              <td>{{ day.tempMax }}° / {{ day.tempMin }}°</td>
              <td>{{ day.precipitation }} mm</td>
              <td>{{ day.windSpeedMax != null ? `${day.windSpeedMax} km/h` : '—' }}</td>
            </tr>
          </tbody>
        </v-table>
      </template>
    </AgriPageCard>
  </div>
</template>

<script setup lang="ts">
import type { WeatherForecastDto, WeatherLocationDto } from '@agrimanage/shared';

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const STORAGE_KEY = 'agrimanage-weather-location';
const api = useApiClient();

const forecast = ref<WeatherForecastDto | null>(null);
const locations = ref<WeatherLocationDto[]>([]);
const searchQuery = ref('');
const loading = ref(false);
const geoLoading = ref(false);
const searchLoading = ref(false);
const error = ref('');
const hint = ref('');

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as {
        latitude: number;
        longitude: number;
        locationName?: string;
      };
      void loadForecast(parsed);
    } catch {
      /* ignore */
    }
  }
});

async function searchLocations() {
  if (!searchQuery.value.trim()) return;
  searchLoading.value = true;
  error.value = '';
  try {
    locations.value = await api.searchWeatherLocations(searchQuery.value.trim());
    if (!locations.value.length) hint.value = 'Aucun lieu trouvé.';
    else hint.value = '';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Recherche impossible';
  } finally {
    searchLoading.value = false;
  }
}

function selectLocation(location: WeatherLocationDto) {
  locations.value = [];
  void loadForecast({
    latitude: location.latitude,
    longitude: location.longitude,
    locationName: [location.name, location.admin1, location.country].filter(Boolean).join(', '),
  });
}

function useGeolocation() {
  if (!navigator.geolocation) {
    error.value = 'Géolocalisation indisponible';
    return;
  }
  geoLoading.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      void loadForecast({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        locationName: 'Ma position',
      }).finally(() => {
        geoLoading.value = false;
      });
    },
    () => {
      error.value = 'Impossible d’obtenir votre position';
      geoLoading.value = false;
    },
  );
}

async function loadForecast(params: {
  latitude: number;
  longitude: number;
  locationName?: string;
}) {
  loading.value = true;
  error.value = '';
  hint.value = '';
  try {
    forecast.value = await api.getWeatherForecast(params);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Prévisions indisponibles';
  } finally {
    loading.value = false;
  }
}

function formatDay(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
</script>
