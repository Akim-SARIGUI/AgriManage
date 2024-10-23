<template>
  <div class="container mx-auto p-4">
    
    <!-- Rapport Détaillé -->
    <transition name="fade" mode="out-in">
      <div v-if="view === 'detailed'" class="rounded-lg bg-white shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold text-green-700 mb-4">Rapports Détaillés</h2>

        <!-- Rendements des Cultures -->
        <section class="mb-6">
          <h3 class="text-xl font-semibold text-green-600 mb-3">Rendements des Cultures</h3>
          <v-data-table :headers="cropYieldHeaders" :items="cropYields" item-key="id" class="mb-4">
            <template v-slot:item.amount="{ item }">
              <span class="font-bold text-green-600">{{ item.amount }} kg</span>
            </template>
          </v-data-table>
        </section>

        <!-- Stocks Disponibles -->
        <section class="mb-6">
          <h3 class="text-xl font-semibold text-green-600 mb-3">Stocks Disponibles</h3>
          <v-data-table :headers="stockHeaders" :items="stocks" item-key="id" class="mb-4">
            <template v-slot:item.quantity="{ item }">
              <span class="font-bold text-green-600">{{ item.quantity }} unités</span>
            </template>
          </v-data-table>
        </section>

        <!-- Rapport Financier -->
        <section class="mb-6">
          <h3 class="text-xl font-semibold text-green-600 mb-3">Rapport Financier</h3>
          <v-card class="p-4 bg-green-50 rounded-lg shadow-md mb-4">
            <strong>Revenus Totaux :</strong> {{ totalRevenues }} €
          </v-card>
          <v-card class="p-4 bg-green-50 rounded-lg shadow-md mb-4">
            <strong>Dépenses Totales :</strong> {{ totalExpenses }} €
          </v-card>
          <v-card class="p-4 bg-green-50 rounded-lg shadow-md mb-4">
            <strong>Solde Net :</strong> {{ netBalance }} €
          </v-card>
        </section>

        <!-- Activités et Planification -->
        <section class="mb-6">
          <h3 class="text-xl font-semibold text-green-600 mb-3">Activités et Planification</h3>
          <v-data-table :headers="activityHeaders" :items="activities" item-key="id" class="mb-4">
            <template v-slot:item.date="{ item }">
              <span class="font-bold text-green-600">{{ item.date }}</span>
            </template>
          </v-data-table>
        </section>

        <!-- Conditions Météorologiques -->
        <section class="mb-6">
          <h3 class="text-xl font-semibold text-green-600 mb-3">Conditions Météorologiques</h3>
          <v-card class="p-4 bg-green-50 rounded-lg shadow-md mb-4">
            <strong>Prévisions Actuelles :</strong> {{ currentWeather }}
          </v-card>
          <v-card class="p-4 bg-green-50 rounded-lg shadow-md mb-4">
            <strong>Historique :</strong> {{ historicalWeather }}
          </v-card>
        </section>

        <!-- Analyse des Données -->
        <section class="mb-6">
          <h3 class="text-xl font-semibold text-green-600 mb-3">Analyse des Données</h3>
          <v-card class="p-4 bg-green-50 rounded-lg shadow-md mb-4">
            <strong>Tendances :</strong> {{ trends }}
          </v-card>
          <v-card class="p-4 bg-green-50 rounded-lg shadow-md mb-4">
            <strong>Comparaison :</strong> {{ comparisons }}
          </v-card>
        </section>

        <v-btn @click="generatePDF('complete')" class="btn-green mt-4">Générer PDF</v-btn>
      </div>
    </transition>
  </div>
</template>

<script>
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default {
  data() {
    return {
      view: 'detailed',
      totalRevenues: 0,
      totalExpenses: 0,
      netBalance: 0,
      cropYieldHeaders: [
        { text: 'Culture', value: 'name' },
        { text: 'Rendement', value: 'amount' },
        { text: 'Date de Plantation', value: 'planting_date' },
        { text: 'Date de Récolte', value: 'harvest_date' }
      ],
      cropYields: [],
      stockHeaders: [
        { text: 'Produit', value: 'name' },
        { text: 'Quantité', value: 'quantity' },
        { text: 'Unité', value: 'unit' }
      ],
      stocks: [],
      activityHeaders: [
        { text: 'Activité', value: 'name' },
        { text: 'Date', value: 'date' },
        { text: 'Détails', value: 'details' }
      ],
      activities: [],
      currentWeather: 'Ensoleillé, 25°C',
      historicalWeather: 'Pluie légère la semaine dernière',
      trends: 'Tendances de croissance des cultures',
      comparisons: 'Comparaison avec l\'année précédente'
    };
  },
  methods: {
    async fetchData() {
      // Récupérer les données des différentes sections
      const cropsResponse = await fetch('http://localhost:3001/api/crops');
      this.cropYields = await cropsResponse.json();

      const stocksResponse = await fetch('http://localhost:3001/api/stocks');
      this.stocks = await stocksResponse.json();

      const activitiesResponse = await fetch('http://localhost:3001/activities');
      this.activities = await activitiesResponse.json();

      const financialsResponse = await fetch('http://localhost:3001/api/financials');
      const financials = await financialsResponse.json();
      this.totalRevenues = financials.totalRevenues;
      this.totalExpenses = financials.totalExpenses;
      this.netBalance = this.totalRevenues - this.totalExpenses;
    },
    generatePDF(reportType) {
      const doc = new jsPDF();
      doc.text('Rapport Complet de la Ferme', 14, 20);

      // Ajout des sections dans le PDF
      doc.text('Rapport Financier', 14, 30);
      doc.autoTable({
        head: [['Section', 'Détail']],
        body: [
          ['Revenus Totaux', `${this.totalRevenues} €`],
          ['Dépenses Totales', `${this.totalExpenses} €`],
          ['Solde Net', `${this.netBalance} €`]
        ]
      });

      doc.save('rapport_complet.pdf');
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>
