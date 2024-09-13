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
      // Récupérer les rendements des cultures
      const cropsResponse = await fetch('http://localhost:3001/api/crops');
      const cropsData = await cropsResponse.json();
      this.cropYields = cropsData.map(crop => ({
        name: crop.name,
        amount: this.calculateYield(crop.id), // Exemple de fonction pour calculer le rendement
        planting_date: crop.planting_date,
        harvest_date: crop.harvest_date
      }));

      // Récupérer les stocks
      const stocksResponse = await fetch('http://localhost:3001/api/stocks');
      this.stocks = await stocksResponse.json();

      // Récupérer les activités
      const activitiesResponse = await fetch('http://localhost:3001/activities');
      this.activities = await activitiesResponse.json();

      // Récupérer les finances
      const financialsResponse = await fetch('http://localhost:3001/api/financials');
      const financials = await financialsResponse.json();
      this.totalRevenues = financials.totalRevenues;
      this.totalExpenses = financials.totalExpenses;
      this.netBalance = this.totalRevenues - this.totalExpenses;
    },
    calculateYield(cropId) {
      // Logique pour calculer le rendement basé sur l'ID de la culture
      // Cela pourrait impliquer des calculs basés sur les données des tables
      return Math.random() * 1000; // Valeur fictive pour l'exemple
    },
    generatePDF(reportType) {
      const doc = new jsPDF();
      doc.text('Rapport Complet de la Ferme', 14, 20);

      // Rapport Financier
      doc.text('Rapport Financier', 14, 30);
      doc.autoTable({
        head: [['Section', 'Détail']],
        body: [
          ['Revenus Totaux', `${this.totalRevenues} €`],
          ['Dépenses Totales', `${this.totalExpenses} €`],
          ['Solde Net', `${this.netBalance} €`]
        ],
        startY: 40
      });

      // Rendements des Cultures
      doc.text('Rendements des Cultures', 14, doc.autoTable.previous.finalY + 20);
      doc.autoTable({
        head: [['Culture', 'Rendement (kg)', 'Date de Plantation', 'Date de Récolte']],
        body: this.cropYields.map(item => [item.name, item.amount, item.planting_date, item.harvest_date]),
        startY: doc.autoTable.previous.finalY + 10
      });

      // Stocks Disponibles
      doc.text('Stocks Disponibles', 14, doc.autoTable.previous.finalY + 20);
      doc.autoTable({
        head: [['Produit', 'Quantité (unités)', 'Unité']],
        body: this.stocks.map(item => [item.name, item.quantity, item.unit]),
        startY: doc.autoTable.previous.finalY + 10
      });

      // Activités et Planification
      doc.text('Activités et Planification', 14, doc.autoTable.previous.finalY + 20);
      doc.autoTable({
        head: [['Activité', 'Date', 'Détails']],
        body: this.activities.map(item => [item.name, item.date, item.details]),
        startY: doc.autoTable.previous.finalY + 10
      });

      // Conditions Météorologiques
      doc.text('Conditions Météorologiques', 14, doc.autoTable.previous.finalY + 20);
      doc.autoTable({
        head: [['Condition', 'Détail']],
        body: [
          ['Prévisions Actuelles', this.currentWeather],
          ['Historique', this.historicalWeather]
        ],
        startY: doc.autoTable.previous.finalY + 10
      });

      // Analyse des Données
      doc.text('Analyse des Données', 14, doc.autoTable.previous.finalY + 20);
      doc.autoTable({
        head: [['Type', 'Détail']],
        body: [
          ['Tendances', this.trends],
          ['Comparaison', this.comparisons]
        ],
        startY: doc.autoTable.previous.finalY + 10
      });

      doc.save('rapport_complet.pdf');
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>
