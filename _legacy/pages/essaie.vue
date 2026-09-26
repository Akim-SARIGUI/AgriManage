<template>
  <v-container fluid>
    <v-row class="ma-5" no-gutters>
      <v-col cols="12" class="d-flex justify-center">
        <v-img
          src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0"
          height="200px"
          class="dashboard-banner"
        ></v-img>
      </v-col>
    </v-row>

    <!-- Affichage des informations pour les différentes sections -->
    <v-row class="mt-5">
      <!-- Affichage des parcelles -->
      <v-col cols="12" md="3" v-if="parcelles.length">
        <v-card class="v-card-animated">
          <v-card-title><strong>Parcelles</strong></v-card-title>
          <v-card-text>
            <ul>
              <li v-for="parcelle in parcelles" :key="parcelle.id">
                {{ parcelle.nom }} - {{ parcelle.superficie }} ha
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Affichage des cultures -->
      <v-col cols="12" md="3" v-if="cultures.length">
        <v-card class="v-card-animated">
          <v-card-title><strong>Cultures</strong></v-card-title>
          <v-card-text>
            <ul>
              <li v-for="culture in cultures" :key="culture.id">
                {{ culture.nom }} - {{ culture.statut }}
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Affichage des stocks -->
      <v-col cols="12" md="3" v-if="stocks.length">
        <v-card class="v-card-animated">
          <v-card-title><strong>Stocks</strong></v-card-title>
          <v-card-text>
            <ul>
              <li v-for="stock in stocks" :key="stock.id">
                {{ stock.produit }} - {{ stock.quantite }} unités
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Affichage des prévisions météo -->
      <v-col cols="12" md="3" v-if="meteo.length">
        <v-card class="v-card-animated">
          <v-card-title><strong>Météo</strong></v-card-title>
          <v-card-text>
            <ul>
              <li v-for="prevision in meteo" :key="prevision.id">
                {{ prevision.date }} - Température: {{ prevision.temperature }}°C
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const parcelles = ref([]);
const cultures = ref([]);
const stocks = ref([]);
const meteo = ref([]);

onMounted(async () => {
  try {
    // Appels API pour récupérer les données du backend
    const parcellesResponse = await axios.get('/api/parcelles');
    parcelles.value = parcellesResponse.data;

    const culturesResponse = await axios.get('/api/cultures');
    cultures.value = culturesResponse.data;

    const stocksResponse = await axios.get('/api/stocks');
    stocks.value = stocksResponse.data;

    const meteoResponse = await axios.get('/api/meteo');
    meteo.value = meteoResponse.data;
  } catch (error) {
    console.error('Erreur lors du chargement des données :', error);
  }
});
</script>

<style scoped>
/* Styles pour votre tableau de bord */
.dashboard-banner {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100vh;
  object-fit: cover;
}
</style>
