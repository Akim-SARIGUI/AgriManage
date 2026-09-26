<template>
  <div class="space-y-6">
    <AgriPageCard
      title="Bienvenue sur AgriManage"
      icon="mdi-view-dashboard"
      :subtitle="user ? `Bonjour, ${user.fullName}` : 'Vue d’ensemble de votre exploitation'"
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <v-card class="agri-kpi-card pa-4" elevation="2">
          <p class="text-sm text-medium-emphasis">Parcelles</p>
          <p class="text-3xl font-semibold text-primary">{{ kpi.parcels }}</p>
        </v-card>
        <v-card class="agri-kpi-card pa-4" elevation="2" style="border-top-color: #2e7d32">
          <p class="text-sm text-medium-emphasis">Cultures</p>
          <p class="text-3xl font-semibold text-success">{{ kpi.crops }}</p>
        </v-card>
        <v-card class="agri-kpi-card pa-4" elevation="2" style="border-top-color: #ef6c00">
          <p class="text-sm text-medium-emphasis">Stock bas</p>
          <p class="text-3xl font-semibold" style="color: #ef6c00">{{ kpi.lowStock }}</p>
        </v-card>
        <v-card class="agri-kpi-card pa-4" elevation="2" style="border-top-color: #1565c0">
          <p class="text-sm text-medium-emphasis">Solde</p>
          <p class="text-2xl font-semibold" style="color: #1565c0">{{ formatMoney(kpi.balance) }}</p>
        </v-card>
      </div>

      <v-card v-if="weatherPreview" class="mt-4 pa-4" color="primary" variant="tonal">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm opacity-80">Météo du jour</p>
            <p class="text-xl font-semibold">
              {{ weatherPreview.days[0]?.weatherLabel }} ·
              {{ weatherPreview.days[0]?.tempMax }}° /
              {{ weatherPreview.days[0]?.tempMin }}°
            </p>
            <p class="text-sm">
              Pluie {{ weatherPreview.days[0]?.precipitation }} mm
              <span v-if="weatherPreview.locationName"> · {{ weatherPreview.locationName }}</span>
            </p>
          </div>
          <v-btn to="/app/weather" variant="flat" color="primary">Voir 7 jours</v-btn>
        </div>
      </v-card>
    </AgriPageCard>

    <div>
      <h2 class="agri-heading mb-4 text-center text-2xl font-semibold text-primary">
        Fonctionnalités principales
      </h2>
      <v-row>
        <v-col v-for="item in modules" :key="item.title" cols="12" md="4">
          <NuxtLink :to="item.to" class="no-underline">
            <v-card class="agri-feature-card pa-6 text-center" outlined elevation="2" hover>
              <v-icon size="56" :color="item.color" class="mb-3">{{ item.icon }}</v-icon>
              <v-card-title class="justify-center text-base font-semibold">
                {{ item.title }}
              </v-card-title>
              <v-card-text class="text-medium-emphasis">
                {{ item.description }}
              </v-card-text>
            </v-card>
          </NuxtLink>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WeatherForecastDto } from '@agrimanage/shared';

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const { user } = useAuth();
const api = useApiClient();
const weatherPreview = ref<WeatherForecastDto | null>(null);

const kpi = reactive({
  parcels: 0,
  crops: 0,
  lowStock: 0,
  balance: 0,
});

const modules = [
  {
    title: 'Gestion des Parcelles',
    description: 'Visualisez et gérez vos parcelles agricoles en temps réel.',
    to: '/app/parcels',
    icon: 'mdi-map-marker',
    color: 'green',
  },
  {
    title: 'Suivi des Cultures',
    description: 'Organisez vos cultures, activités et interventions.',
    to: '/app/crops',
    icon: 'mdi-leaf',
    color: 'success',
  },
  {
    title: 'Prévisions Météo',
    description: 'Accédez à des prévisions pour mieux planifier vos travaux.',
    to: '/app/weather',
    icon: 'mdi-weather-cloudy',
    color: 'orange',
  },
  {
    title: 'Gestion Financière',
    description: 'Suivez vos revenus, dépenses et le solde de l’exploitation.',
    to: '/app/finance',
    icon: 'mdi-finance',
    color: 'purple',
  },
  {
    title: 'Gestion des Stocks',
    description: 'Intrants agricoles et produits récoltés.',
    to: '/app/stocks?type=HOME',
    icon: 'mdi-warehouse',
    color: 'red',
  },
  {
    title: 'Recommandations',
    description: 'Bonnes pratiques pour améliorer vos rendements.',
    to: '/app/recommendations',
    icon: 'mdi-lightbulb',
    color: 'teal',
  },
];

onMounted(async () => {
  try {
    const [parcels, crops, stocks, finance] = await Promise.all([
      api.listParcels(),
      api.listCrops(),
      api.listStocks(),
      api.getFinanceSummary(),
    ]);
    let threshold = 5;
    try {
      const meta = await api.getStockMeta();
      threshold = meta.lowStockThreshold;
    } catch {
      /* default */
    }
    kpi.parcels = parcels.length;
    kpi.crops = crops.length;
    kpi.lowStock = stocks.filter((item) => item.quantity <= threshold).length;
    kpi.balance = finance.balance;
  } catch {
    /* keep zeros */
  }

  const saved = localStorage.getItem('agrimanage-weather-location');
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved) as {
      latitude: number;
      longitude: number;
      locationName?: string;
    };
    weatherPreview.value = await api.getWeatherForecast(parsed);
  } catch {
    weatherPreview.value = null;
  }
});

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(value);
}
</script>
