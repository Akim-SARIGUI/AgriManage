<template>
  <v-container fluid>
    <!-- En-tête du tableau de bord -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex justify-center">
        <v-img
          src="@/public/carte.jpg"
          height="200px"
          class="dashboard-banner"
        ></v-img>
      </v-col>
    </v-row>

    <!-- Cartes de données principales -->
    <v-row>
      <v-col cols="12" md="6" lg="4">
        <v-card class="pa-4 mb-4" outlined>
          <v-card-title>Résumé des Parcelles</v-card-title>
          <v-card-text>
            <p>Nombre total de parcelles : {{ plotSummary.total }}</p>
            <p>Superficie totale : {{ plotSummary.totalArea }} hectares</p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="viewPlots" color="primary" class="animated-btn">
              Voir les parcelles
              <v-icon right>mdi-eye</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="4">
        <v-card class="pa-4 mb-4" outlined>
          <v-card-title>Statistiques des Cultures</v-card-title>
          <v-card-text>
            <p>Nombre total de cultures : {{ cropsSummary.total }}</p>
            <p>Superficie cultivée : {{ cropsSummary.totalArea }} hectares</p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="viewCrops" color="primary" class="animated-btn">
              Voir les cultures
              <v-icon right>mdi-leaf</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="4">
        <v-card class="pa-4 mb-4" outlined>
          <v-card-title>Stocks Disponibles</v-card-title>
          <v-card-text>
            <p>Quantité totale en stock : {{ stockSummary.totalQuantity }} unités</p>
            <p>Valeur totale du stock : {{ stockSummary.totalValue }} €</p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="viewStocks" color="primary" class="animated-btn">
              Voir les stocks
              <v-icon right>mdi-package-variant</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="4">
        <v-card class="pa-4 mb-4" outlined>
          <v-card-title>Prévisions Météorologiques</v-card-title>
          <v-card-text>
            <p>Température moyenne : {{ weatherForecast.avgTemperature }} °C</p>
            <p>Précipitations prévues : {{ weatherForecast.totalPrecipitation }} mm</p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="viewWeatherForecast" color="primary" class="animated-btn">
              Voir les prévisions
              <v-icon right>mdi-weather-partly-cloudy</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="4">
        <v-card class="pa-4 mb-4" outlined>
          <v-card-title>Situation Financière</v-card-title>
          <v-card-text>
            <p>Revenus totaux : {{ financialSummary.totalRevenue }} €</p>
            <p>Dépenses totales : {{ financialSummary.totalExpenses }} €</p>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="viewFinancialSummary" color="primary" class="animated-btn">
              Voir les finances
              <v-icon right>mdi-cash-multiple</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card class="pa-4" outlined>
          <v-card-title class="text-center">Rapport Global</v-card-title>
          <v-card-text>
            <p>Résumé complet des opérations de la ferme avec des analyses détaillées.</p>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn @click="viewGlobalReport" color="primary" class="animated-btn">
              Voir le rapport
              <v-icon right>mdi-file-document-outline</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      plotSummary: {
        total: 5,
        totalArea: 50
      },
      cropsSummary: {
        total: 20,
        totalArea: 30
      },
      stockSummary: {
        totalQuantity: 1000,
        totalValue: 5000
      },
      weatherForecast: {
        avgTemperature: 22,
        totalPrecipitation: 10
      },
      financialSummary: {
        totalRevenue: 15000,
        totalExpenses: 5000
      }
    };
  },
  methods: {
    viewPlots() {
      // Logique pour voir les parcelles
    },
    viewCrops() {
      // Logique pour voir les cultures
    },
    viewStocks() {
      // Logique pour voir les stocks
    },
    viewWeatherForecast() {
      // Logique pour voir les prévisions météo
    },
    viewFinancialSummary() {
      // Logique pour voir le résumé financier
    },
    viewGlobalReport() {
      // Logique pour voir le rapport global
    }
  }
};
</script>

<style scoped>
.dashboard-banner {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.animated-btn {
  transition: background-color 0.3s, transform 0.3s;
}
.animated-btn:hover {
  background-color: #1976d2;
  transform: scale(1.05);
}

</style>
