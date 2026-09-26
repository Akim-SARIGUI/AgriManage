<template>
  <div>
    <v-alert v-if="error" type="error" density="comfortable" class="mb-4">{{ error }}</v-alert>

    <!-- Hub : Intrants / Produits récoltés -->
    <div v-if="showHub" class="stock-hub agri-page-enter">
      <div class="mb-6">
        <h2 class="font-display text-2xl font-semibold text-[color:var(--agri-forest)]">
          Gestion des stocks
        </h2>
        <p class="mt-1 text-sm text-[color:var(--agri-muted)]">
          Choisissez une famille de stock pour gérer vos articles et mouvements.
        </p>
      </div>

      <div class="stock-hub__grid">
        <button type="button" class="stock-hub-card" @click="openSection('intrants')">
          <div class="stock-hub-card__icon stock-hub-card__icon--intrants">
            <v-icon size="28">mdi-sprout</v-icon>
          </div>
          <div class="stock-hub-card__body">
            <p class="stock-hub-card__eyebrow">Famille A</p>
            <h3 class="stock-hub-card__title">Intrants agricoles</h3>
            <p class="stock-hub-card__desc">
              Gérez vos semences, engrais et pesticides — avec alertes stock bas.
            </p>
            <div class="stock-hub-card__meta">
              <span>{{ intrantsCount }} article{{ intrantsCount > 1 ? 's' : '' }}</span>
              <span v-if="intrantsLow" class="stock-hub-card__warn">
                {{ intrantsLow }} bas
              </span>
            </div>
          </div>
          <span class="stock-hub-card__cta">
            Accéder
            <v-icon size="18">mdi-arrow-right</v-icon>
          </span>
        </button>

        <button type="button" class="stock-hub-card" @click="openSection('produits')">
          <div class="stock-hub-card__icon stock-hub-card__icon--produits">
            <v-icon size="28">mdi-basket</v-icon>
          </div>
          <div class="stock-hub-card__body">
            <p class="stock-hub-card__eyebrow">Famille B</p>
            <h3 class="stock-hub-card__title">Produits récoltés</h3>
            <p class="stock-hub-card__desc">
              Suivez les quantités récoltées, stockées et les mouvements associés.
            </p>
            <div class="stock-hub-card__meta">
              <span>{{ productsCount }} article{{ productsCount > 1 ? 's' : '' }}</span>
              <span v-if="productsLow" class="stock-hub-card__warn">
                {{ productsLow }} bas
              </span>
            </div>
          </div>
          <span class="stock-hub-card__cta">
            Accéder
            <v-icon size="18">mdi-arrow-right</v-icon>
          </span>
        </button>
      </div>
    </div>

    <!-- Détail section -->
    <AgriPageCard
      v-else
      :title="sectionTitle"
      :icon="sectionIcon"
      :subtitle="sectionSubtitle"
    >
      <template #title-actions>
        <v-btn
          size="small"
          variant="text"
          color="white"
          prepend-icon="mdi-view-grid-outline"
          @click="goHub"
        >
          Vue d’ensemble
        </v-btn>
      </template>

      <v-tabs
        :key="currentSection"
        color="primary"
        class="mb-4"
        :model-value="selectedTab"
        @update:model-value="onTabChange"
      >
        <v-tab v-for="tab in currentTabs" :key="tab.value" :value="tab.value">
          {{ tab.label }}
        </v-tab>
      </v-tabs>

      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Rechercher un article"
        density="comfortable"
        clearable
        hide-details
        outlined
        class="mb-4 max-w-md"
      />

      <v-alert
        v-if="sectionLowStock.length && selectedTab !== 'HISTORY'"
        type="warning"
        density="comfortable"
        class="mb-4"
      >
        Stock bas (≤ {{ lowStockThreshold }}) :
        {{ sectionLowStock.map((item) => item.name).join(', ') }}
      </v-alert>

      <template v-if="selectedTab !== 'HISTORY'">
        <div v-if="loading" class="pa-8 text-center text-medium-emphasis">Chargement…</div>
        <div v-else-if="filteredStocks.length === 0" class="pa-8 text-center text-medium-emphasis">
          Aucun article dans cette catégorie.
        </div>
        <v-table v-else class="agri-table elevation-1">
          <thead>
            <tr>
              <th class="text-left">Article</th>
              <th class="text-left">Quantité</th>
              <th class="text-left">Unité</th>
              <th class="agri-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stock in filteredStocks" :key="stock.id">
              <td class="font-medium">
                {{ stock.name }}
                <v-chip
                  v-if="stock.quantity <= lowStockThreshold"
                  size="x-small"
                  color="warning"
                  class="ml-2"
                >
                  Bas
                </v-chip>
              </td>
              <td>{{ stock.quantity }}</td>
              <td>{{ stock.unit }}</td>
              <td class="agri-col-actions">
                <div class="agri-fab-actions">
                  <IconAction
                    icon="mdi-swap-horizontal"
                    label="Entrée / Sortie"
                    color="info"
                    @click="openMove(stock)"
                  />
                  <IconAction
                    icon="mdi-pencil"
                    label="Modifier"
                    color="secondary"
                    @click="openEdit(stock)"
                  />
                  <IconAction
                    icon="mdi-delete"
                    label="Supprimer"
                    color="error"
                    @click="confirmDelete(stock)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </template>

      <template v-else>
        <div class="mb-3 flex flex-wrap gap-3">
          <v-select
            v-model="historyLevel"
            :items="levelOptions"
            item-title="title"
            item-value="value"
            label="Mouvement"
            clearable
            density="comfortable"
            outlined
            class="max-w-xs"
            @update:model-value="loadHistory"
          />
        </div>

        <div v-if="historyLoading" class="pa-8 text-center text-medium-emphasis">
          Chargement de l’historique…
        </div>

        <v-table v-else class="agri-table elevation-1">
          <thead>
            <tr>
              <th class="text-left">Date</th>
              <th class="text-left">Article</th>
              <th class="text-left">Type</th>
              <th class="text-left">Mouvement</th>
              <th class="text-left">Quantité</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredHistory" :key="item.id">
              <td>{{ formatDate(item.date) }}</td>
              <td>{{ item.name }}</td>
              <td>{{ typeLabel(item.type) }}</td>
              <td>
                <v-chip
                  size="small"
                  :color="item.level === 'IN' ? 'success' : 'error'"
                  variant="tonal"
                >
                  {{ item.level === 'IN' ? 'Entrée' : 'Sortie' }}
                </v-chip>
              </td>
              <td>{{ item.quantity }} {{ item.unit }}</td>
            </tr>
          </tbody>
        </v-table>
      </template>

      <template v-if="selectedTab !== 'HISTORY'" #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" elevation="2" @click="openCreate">
          Ajouter un article
        </v-btn>
      </template>
    </AgriPageCard>

    <v-dialog v-model="dialog" persistent max-width="480">
      <v-card>
        <v-card-title class="agri-dialog-title">
          {{ editingId ? 'Modifier l’article' : 'Nouvel article' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-select
            v-model="form.type"
            :items="formTypeOptions"
            item-title="title"
            item-value="value"
            label="Catégorie"
            outlined
            class="mb-2"
          />
          <v-text-field v-model="form.name" label="Nom" required outlined class="mb-2" />
          <v-text-field
            v-model.number="form.quantity"
            label="Quantité"
            type="number"
            min="0"
            step="0.01"
            outlined
            class="mb-2"
          />
          <v-text-field v-model="form.unit" label="Unité (kg, L, sacs…)" required outlined />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" :loading="saving" @click="save">Enregistrer</v-btn>
          <v-btn color="error" variant="text" @click="dialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="moveDialog" persistent max-width="420">
      <v-card>
        <v-card-title class="agri-dialog-title">Mouvement — {{ movingStock?.name }}</v-card-title>
        <v-card-text class="pt-4">
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-btn-toggle v-model="moveForm.level" mandatory color="primary" class="mb-4">
            <v-btn value="IN">Entrée</v-btn>
            <v-btn value="OUT">Sortie</v-btn>
          </v-btn-toggle>
          <v-text-field
            v-model.number="moveForm.quantity"
            label="Quantité"
            type="number"
            min="0.01"
            step="0.01"
            outlined
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" :loading="saving" @click="saveMove">Valider</v-btn>
          <v-btn color="error" variant="text" @click="moveDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  StockMovementLevel,
  StockType,
  type StockDto,
  type StockHistoryDto,
} from '@agrimanage/shared';
import { ApiError } from '@agrimanage/api-client';

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const api = useApiClient();
const route = useRoute();
const router = useRouter();

const intrantsTabs = [
  { label: 'Semences', value: StockType.SEED },
  { label: 'Engrais', value: StockType.FERTILIZER },
  { label: 'Pesticides', value: StockType.PESTICIDE },
  { label: 'Historique', value: 'HISTORY' },
] as const;

const produitsTabs = [
  { label: 'Récoltes', value: StockType.PRODUCT },
  { label: 'Historique', value: 'HISTORY' },
] as const;

const typeOptions = [
  { title: 'Semences', value: StockType.SEED },
  { title: 'Engrais', value: StockType.FERTILIZER },
  { title: 'Pesticides', value: StockType.PESTICIDE },
  { title: 'Récoltes', value: StockType.PRODUCT },
];

const levelOptions = [
  { title: 'Entrées', value: StockMovementLevel.IN },
  { title: 'Sorties', value: StockMovementLevel.OUT },
];

const search = ref('');
const stocks = ref<StockDto[]>([]);
const history = ref<StockHistoryDto[]>([]);
const historyLevel = ref<StockMovementLevel | null>(null);
const lowStockThreshold = ref(5);
const loading = ref(true);
const historyLoading = ref(false);
const saving = ref(false);
const error = ref('');
const formError = ref('');
/** Empêche les allers-retours URL ↔ v-tabs pendant un changement de section */
const syncingFromRoute = ref(false);

const dialog = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  name: '',
  quantity: 0,
  unit: 'kg',
  type: StockType.SEED as StockType,
});

const moveDialog = ref(false);
const movingStock = ref<StockDto | null>(null);
const moveForm = reactive({
  level: StockMovementLevel.IN as StockMovementLevel,
  quantity: 1,
});

const showHub = computed(() => {
  const type = route.query.type;
  return type == null || type === '' || type === 'HOME';
});

const currentSection = computed<'intrants' | 'produits'>(() => {
  const type = String(route.query.type || '');
  const section = String(route.query.section || '');
  if (type === 'HISTORY') {
    return section === 'intrants' ? 'intrants' : 'produits';
  }
  if (type === StockType.PRODUCT) return 'produits';
  if (section === 'intrants' || section === 'produits') return section;
  return 'intrants';
});

const currentTabs = computed(() =>
  currentSection.value === 'produits' ? [...produitsTabs] : [...intrantsTabs],
);

const selectedTab = computed(() => {
  const type = String(route.query.type || StockType.SEED);
  const allowed = currentTabs.value.map((tab) => String(tab.value));
  if (allowed.includes(type)) return type;
  return String(currentTabs.value[0]?.value ?? StockType.SEED);
});

const sectionTitle = computed(() =>
  currentSection.value === 'produits' ? 'Produits récoltés' : 'Intrants agricoles',
);

const sectionIcon = computed(() =>
  currentSection.value === 'produits' ? 'mdi-basket' : 'mdi-sprout',
);

const sectionSubtitle = computed(() =>
  currentSection.value === 'produits'
    ? 'Récoltes stockées et historique des mouvements'
    : 'Semences, engrais, pesticides et historique des mouvements',
);

const formTypeOptions = computed(() =>
  currentSection.value === 'produits'
    ? typeOptions.filter((item) => item.value === StockType.PRODUCT)
    : typeOptions.filter((item) => item.value !== StockType.PRODUCT),
);

const filteredStocks = computed(() => {
  const query = search.value.trim().toLowerCase();
  return stocks.value.filter((stock) => {
    if (stock.type !== selectedTab.value) return false;
    if (!query) return true;
    return (
      stock.name.toLowerCase().includes(query) ||
      stock.unit.toLowerCase().includes(query)
    );
  });
});

const filteredHistory = computed(() => {
  const query = search.value.trim().toLowerCase();
  const list =
    currentSection.value === 'produits'
      ? history.value.filter((item) => item.type === StockType.PRODUCT)
      : history.value.filter(
          (item) =>
            item.type === StockType.SEED ||
            item.type === StockType.FERTILIZER ||
            item.type === StockType.PESTICIDE,
        );
  if (!query) return list;
  return list.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      typeLabel(item.type).toLowerCase().includes(query),
  );
});

const sectionLowStock = computed(() => {
  const types =
    currentSection.value === 'produits'
      ? new Set([StockType.PRODUCT])
      : new Set([StockType.SEED, StockType.FERTILIZER, StockType.PESTICIDE]);
  return stocks.value.filter(
    (stock) => types.has(stock.type) && stock.quantity <= lowStockThreshold.value,
  );
});

const intrantsCount = computed(
  () =>
    stocks.value.filter(
      (s) =>
        s.type === StockType.SEED ||
        s.type === StockType.FERTILIZER ||
        s.type === StockType.PESTICIDE,
    ).length,
);

const productsCount = computed(
  () => stocks.value.filter((s) => s.type === StockType.PRODUCT).length,
);

const intrantsLow = computed(
  () =>
    stocks.value.filter(
      (s) =>
        (s.type === StockType.SEED ||
          s.type === StockType.FERTILIZER ||
          s.type === StockType.PESTICIDE) &&
        s.quantity <= lowStockThreshold.value,
    ).length,
);

const productsLow = computed(
  () =>
    stocks.value.filter(
      (s) => s.type === StockType.PRODUCT && s.quantity <= lowStockThreshold.value,
    ).length,
);

function syncFromRoute() {
  if (showHub.value) return;
  if (selectedTab.value === 'HISTORY') void loadHistory();
}

onMounted(async () => {
  syncFromRoute();
  try {
    const meta = await api.getStockMeta();
    lowStockThreshold.value = meta.lowStockThreshold;
  } catch {
    /* keep default */
  }
  await loadStocks();
});

watch(
  () => [route.query.type, route.query.section],
  () => {
    syncingFromRoute.value = true;
    syncFromRoute();
    nextTick(() => {
      syncingFromRoute.value = false;
    });
  },
);

async function loadStocks() {
  loading.value = true;
  error.value = '';
  try {
    stocks.value = await api.listStocks();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossible de charger les stocks';
    error.value = /too many requests|throttle/i.test(message)
      ? 'Trop de requêtes — patientez quelques secondes puis actualisez.'
      : message;
  } finally {
    loading.value = false;
  }
}

async function loadHistory() {
  historyLoading.value = true;
  error.value = '';
  try {
    history.value = await api.listStockHistory({
      level: historyLevel.value || undefined,
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Impossible de charger l’historique';
  } finally {
    historyLoading.value = false;
  }
}

function openSection(section: 'intrants' | 'produits') {
  void router.push({
    query: { type: section === 'produits' ? StockType.PRODUCT : StockType.SEED },
  });
}

function goHub() {
  void router.push({ query: { type: 'HOME' } });
}

function onTabChange(value: unknown) {
  if (syncingFromRoute.value) return;
  const next = String(value);
  const allowed = currentTabs.value.map((tab) => String(tab.value));
  if (!allowed.includes(next)) return;

  if (next === 'HISTORY') {
    const section = currentSection.value;
    if (String(route.query.type) === 'HISTORY' && String(route.query.section) === section) {
      return;
    }
    void router.replace({ query: { type: 'HISTORY', section } });
    void loadHistory();
    return;
  }

  if (String(route.query.type) === next) return;
  void router.replace({ query: { type: next } });
}

function openCreate() {
  editingId.value = null;
  form.name = '';
  form.quantity = 0;
  form.unit = 'kg';
  form.type =
    selectedTab.value !== 'HISTORY'
      ? (selectedTab.value as StockType)
      : currentSection.value === 'produits'
        ? StockType.PRODUCT
        : StockType.SEED;
  formError.value = '';
  dialog.value = true;
}

function openEdit(stock: StockDto) {
  editingId.value = stock.id;
  form.name = stock.name;
  form.quantity = stock.quantity;
  form.unit = stock.unit;
  form.type = stock.type;
  formError.value = '';
  dialog.value = true;
}

async function save() {
  if (!form.name.trim() || !form.unit.trim()) {
    formError.value = 'Nom et unité sont obligatoires';
    return;
  }

  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity) || 0,
      unit: form.unit.trim(),
      type: form.type,
    };

    if (editingId.value) {
      await api.updateStock(editingId.value, payload);
    } else {
      await api.createStock(payload);
    }

    dialog.value = false;
    await loadStocks();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

function openMove(stock: StockDto) {
  movingStock.value = stock;
  moveForm.level = StockMovementLevel.IN;
  moveForm.quantity = 1;
  formError.value = '';
  moveDialog.value = true;
}

async function saveMove() {
  if (!movingStock.value || !moveForm.quantity || moveForm.quantity <= 0) {
    formError.value = 'Quantité invalide';
    return;
  }

  saving.value = true;
  formError.value = '';
  try {
    await api.moveStock(movingStock.value.id, {
      level: moveForm.level,
      quantity: Number(moveForm.quantity),
    });
    moveDialog.value = false;
    await loadStocks();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(stock: StockDto) {
  if (!window.confirm(`Supprimer « ${stock.name} » du stock ?`)) return;
  try {
    await api.deleteStock(stock.id);
    await loadStocks();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  }
}

function typeLabel(type: StockType) {
  return typeOptions.find((item) => item.value === type)?.title ?? type;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR');
}
</script>

<style scoped>
.stock-hub__grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .stock-hub__grid {
    grid-template-columns: 1fr 1fr;
  }
}

.stock-hub-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.35rem 1.4rem;
  border: 1px solid var(--agri-border);
  border-radius: 1rem;
  background: var(--agri-surface);
  box-shadow: 0 10px 30px -14px rgba(27, 67, 50, 0.22);
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.stock-hub-card:hover {
  transform: translateY(-3px);
  border-color: rgba(45, 106, 79, 0.28);
  box-shadow: 0 18px 40px -14px rgba(27, 67, 50, 0.3);
}

.stock-hub-card__icon {
  display: inline-flex;
  width: 3rem;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.85rem;
  color: #fff;
}

.stock-hub-card__icon--intrants {
  background: linear-gradient(135deg, var(--agri-green), var(--agri-leaf));
}

.stock-hub-card__icon--produits {
  background: linear-gradient(135deg, var(--agri-soil), var(--agri-wheat));
}

.stock-hub-card__eyebrow {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--agri-muted);
}

.stock-hub-card__title {
  margin: 0.25rem 0 0;
  font-family: Poppins, Roboto, 'Segoe UI', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--agri-forest);
}

.stock-hub-card__desc {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--agri-muted);
}

.stock-hub-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.85rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--agri-green);
}

.stock-hub-card__warn {
  color: #a16207;
}

.stock-hub-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: auto;
  padding-top: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--agri-forest);
}
</style>
