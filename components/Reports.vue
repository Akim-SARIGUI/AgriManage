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
        { text: 'Culture', value: 'crop' },
        { text: 'Rendement', value: 'amount' },
        { text: 'Date de Récolte', value: 'harvestDate' }
      ],
      cropYields: [],
      stockHeaders: [
        { text: 'Produit', value: 'product' },
        { text: 'Quantité', value: 'quantity' },
        { text: 'Date de Stockage', value: 'storageDate' }
      ],
      stocks: [],
      activityHeaders: [
        { text: 'Activité', value: 'activity' },
        { text: 'Date', value: 'date' }
      ],
      activities: [],
      currentWeather: '',
      historicalWeather: '',
      trends: '',
      comparisons: ''
    };
  },
  methods: {
    async fetchData() {
      // Appels API pour récupérer les données
      const cropYieldsResponse = await fetch('/api/cropYields');
      this.cropYields = await cropYieldsResponse.json();

      const stocksResponse = await fetch('/api/stocks');
      this.stocks = await stocksResponse.json();

      const activitiesResponse = await fetch('/api/activities');
      this.activities = await activitiesResponse.json();

      const financialsResponse = await fetch('/api/financials');
      const financials = await financialsResponse.json();
      this.totalRevenues = financials.totalRevenues;
      this.totalExpenses = financials.totalExpenses;
      this.netBalance = this.totalRevenues - this.totalExpenses;

      const weatherResponse = await fetch('/api/weather');
      const weatherData = await weatherResponse.json();
      this.currentWeather = weatherData.current;
      this.historicalWeather = weatherData.historical;

      // Analyse des données
      this.trends = 'Analyse des tendances à venir...';
      this.comparisons = 'Comparaison avec l\'année précédente...';
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
        head: [['Culture', 'Rendement (kg)', 'Date de Récolte']],
        body: this.cropYields.map(item => [item.crop, item.amount, item.harvestDate]),
        startY: doc.autoTable.previous.finalY + 10
      });

      // Stocks Disponibles
      doc.text('Stocks Disponibles', 14, doc.autoTable.previous.finalY + 20);
      doc.autoTable({
        head: [['Produit', 'Quantité (unités)', 'Date de Stockage']],
        body: this.stocks.map(item => [item.product, item.quantity, item.storageDate]),
        startY: doc.autoTable.previous.finalY + 10
      });

      // Activités et Planification
      doc.text('Activités et Planification', 14, doc.autoTable.previous.finalY + 20);
      doc.autoTable({
        head: [['Activité', 'Date']],
        body: this.activities.map(item => [item.activity, item.date]),
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
