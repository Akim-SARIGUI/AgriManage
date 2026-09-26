<template>
  <div>
    <v-alert v-if="error" type="error" density="comfortable" class="mb-4">{{ error }}</v-alert>
    <v-alert v-if="success" type="success" density="comfortable" class="mb-4">{{ success }}</v-alert>

    <AgriPageCard
      title="Rapports d’exploitation"
      icon="mdi-file-pdf-box"
      subtitle="Exportez un bilan PDF (parcelles, cultures, stocks, finance)"
    >
      <div class="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <v-card class="agri-kpi-card pa-4" elevation="2">
          <p class="text-sm text-medium-emphasis">Parcelles</p>
          <p class="text-2xl font-semibold text-primary">{{ summary.parcels }}</p>
        </v-card>
        <v-card class="agri-kpi-card pa-4" elevation="2" style="border-top-color: #2e7d32">
          <p class="text-sm text-medium-emphasis">Cultures</p>
          <p class="text-2xl font-semibold text-success">{{ summary.crops }}</p>
        </v-card>
        <v-card class="agri-kpi-card pa-4" elevation="2" style="border-top-color: #ef6c00">
          <p class="text-sm text-medium-emphasis">Articles en stock</p>
          <p class="text-2xl font-semibold" style="color: #ef6c00">{{ summary.stocks }}</p>
        </v-card>
        <v-card class="agri-kpi-card pa-4" elevation="2" style="border-top-color: #1565c0">
          <p class="text-sm text-medium-emphasis">Solde</p>
          <p class="text-2xl font-semibold" style="color: #1565c0">
            {{ formatMoney(summary.balance) }}
          </p>
        </v-card>
      </div>

      <h2 class="mb-2 text-subtitle-1 font-weight-bold">Contenu du PDF</h2>
      <ul class="mb-2 list-disc space-y-1 pl-5 text-body-2 text-medium-emphasis">
        <li>Identité de l’exploitation et date d’export</li>
        <li>Liste des parcelles (surface + localisation)</li>
        <li>Liste des cultures</li>
        <li>État des stocks</li>
        <li>Synthèse financière (revenus, dépenses, solde)</li>
      </ul>

      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-file-pdf-box"
          elevation="2"
          :loading="exporting"
          @click="exportPdf"
        >
          Télécharger le PDF
        </v-btn>
      </template>
    </AgriPageCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const api = useApiClient();
const { user } = useAuth();

const exporting = ref(false);
const error = ref('');
const success = ref('');
const summary = reactive({
  parcels: 0,
  crops: 0,
  stocks: 0,
  balance: 0,
});

onMounted(() => {
  void loadPreview();
});

async function loadPreview() {
  try {
    const [parcels, crops, stocks, finance] = await Promise.all([
      api.listParcels(),
      api.listCrops(),
      api.listStocks(),
      api.getFinanceSummary(),
    ]);
    summary.parcels = parcels.length;
    summary.crops = crops.length;
    summary.stocks = stocks.length;
    summary.balance = finance.balance;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Chargement impossible';
  }
}

async function exportPdf() {
  exporting.value = true;
  error.value = '';
  success.value = '';
  try {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const autoTable = autoTableModule.default;

    const [parcels, crops, stocks, finance, revenues, expenses] = await Promise.all([
      api.listParcels(),
      api.listCrops(),
      api.listStocks(),
      api.getFinanceSummary(),
      api.listRevenues(),
      api.listExpenses(),
    ]);

    const doc = new jsPDF();
    const farmer = user.value?.fullName ?? 'Agriculteur';
    const today = new Date().toLocaleDateString('fr-FR');

    doc.setFontSize(18);
    doc.text('AgriManage — Rapport d’exploitation', 14, 20);
    doc.setFontSize(11);
    doc.text(`Exploitant : ${farmer}`, 14, 30);
    doc.text(`Date d’export : ${today}`, 14, 37);
    doc.text(
      `Synthèse : ${parcels.length} parcelles · ${crops.length} cultures · ${stocks.length} stocks · solde ${formatMoney(finance.balance)}`,
      14,
      44,
    );

    autoTable(doc, {
      startY: 52,
      head: [['Parcelle', 'Surface (ha)', 'Localisation']],
      body: parcels.map((parcel) => [
        parcel.name,
        parcel.size ?? '—',
        parcel.latitude != null
          ? parcel.locationLabel || `${parcel.latitude}, ${parcel.longitude}`
          : 'Non définie',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [27, 94, 32] },
    });

    const docWithTable = doc as typeof doc & { lastAutoTable: { finalY: number } };

    autoTable(doc, {
      startY: docWithTable.lastAutoTable.finalY + 10,
      head: [['Culture', 'Parcelle', 'Plantation', 'Récolte']],
      body: crops.map((crop) => [
        crop.name,
        crop.parcelName ?? crop.parcelId,
        crop.plantingDate ? new Date(crop.plantingDate).toLocaleDateString('fr-FR') : '—',
        crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString('fr-FR') : '—',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [46, 125, 50] },
    });

    autoTable(doc, {
      startY: docWithTable.lastAutoTable.finalY + 10,
      head: [['Stock', 'Type', 'Quantité', 'Unité']],
      body: stocks.map((stock) => [
        stock.name,
        stock.type,
        String(stock.quantity),
        stock.unit,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [93, 64, 55] },
    });

    autoTable(doc, {
      startY: docWithTable.lastAutoTable.finalY + 10,
      head: [['Finance', 'Montant']],
      body: [
        ['Total revenus', formatMoney(finance.totalRevenue)],
        ['Total dépenses', formatMoney(finance.totalExpense)],
        ['Solde', formatMoney(finance.balance)],
        ['Nb revenus', String(revenues.length)],
        ['Nb dépenses', String(expenses.length)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [21, 101, 192] },
    });

    doc.save(`agrimanage-rapport-${new Date().toISOString().slice(0, 10)}.pdf`);
    success.value = 'PDF téléchargé avec succès.';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Export PDF impossible';
  } finally {
    exporting.value = false;
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(value);
}
</script>
