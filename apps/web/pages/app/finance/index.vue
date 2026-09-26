<template>
  <div>
    <v-alert v-if="error" type="error" density="comfortable" class="mb-4">{{ error }}</v-alert>

    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card class="agri-kpi-card pa-4" elevation="3" style="border-top-color: #2e7d32">
          <p class="text-sm text-medium-emphasis">Total revenus</p>
          <p class="text-2xl font-semibold text-success">{{ formatMoney(summary.totalRevenue) }}</p>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="agri-kpi-card pa-4" elevation="3" style="border-top-color: #c62828">
          <p class="text-sm text-medium-emphasis">Total dépenses</p>
          <p class="text-2xl font-semibold text-error">{{ formatMoney(summary.totalExpense) }}</p>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card
          class="agri-kpi-card pa-4"
          elevation="3"
          :style="{ borderTopColor: summary.balance >= 0 ? '#1b5e20' : '#ef6c00' }"
        >
          <p class="text-sm text-medium-emphasis">Solde / Bénéfice</p>
          <p class="text-2xl font-semibold text-primary">{{ formatMoney(summary.balance) }}</p>
        </v-card>
      </v-col>
    </v-row>

    <AgriPageCard title="Comptabilité Financière" icon="mdi-cash-multiple">
      <v-tabs v-model="tab" color="primary" class="mb-4">
        <v-tab value="revenues">Revenus</v-tab>
        <v-tab value="expenses">Dépenses</v-tab>
      </v-tabs>

      <div v-if="loading" class="pa-8 text-center text-medium-emphasis">Chargement…</div>

      <template v-else-if="tab === 'revenues'">
        <div v-if="revenues.length === 0" class="pa-8 text-center text-medium-emphasis">
          Aucun revenu enregistré.
        </div>
        <v-table v-else class="agri-table elevation-1">
          <thead>
            <tr>
              <th class="text-left">Date</th>
              <th class="text-left">Source</th>
              <th class="text-left">Montant</th>
              <th class="agri-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in revenues" :key="item.id">
              <td>{{ formatDate(item.date) }}</td>
              <td>{{ item.source }}</td>
              <td class="font-medium text-success">{{ formatMoney(item.amount) }}</td>
              <td class="agri-col-actions">
                <div class="agri-fab-actions">
                <IconAction
                  icon="mdi-pencil"
                  label="Modifier"
                  color="secondary"
                  @click="openRevenueEdit(item)"
                />
                <IconAction
                  icon="mdi-delete"
                  label="Supprimer"
                  color="error"
                  @click="removeRevenue(item)"
                />
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </template>

      <template v-else>
        <div v-if="expenses.length === 0" class="pa-8 text-center text-medium-emphasis">
          Aucune dépense enregistrée.
        </div>
        <v-table v-else class="agri-table elevation-1">
          <thead>
            <tr>
              <th class="text-left">Date</th>
              <th class="text-left">Catégorie</th>
              <th class="text-left">Montant</th>
              <th class="agri-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in expenses" :key="item.id">
              <td>{{ formatDate(item.date) }}</td>
              <td>{{ item.category }}</td>
              <td class="font-medium text-error">{{ formatMoney(item.amount) }}</td>
              <td class="agri-col-actions">
                <div class="agri-fab-actions">
                <IconAction
                  icon="mdi-pencil"
                  label="Modifier"
                  color="secondary"
                  @click="openExpenseEdit(item)"
                />
                <IconAction
                  icon="mdi-delete"
                  label="Supprimer"
                  color="error"
                  @click="removeExpense(item)"
                />
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </template>

      <template #actions>
        <v-btn color="success" prepend-icon="mdi-plus" class="mr-2" @click="openRevenueCreate">
          Revenu
        </v-btn>
        <v-btn color="error" prepend-icon="mdi-plus" @click="openExpenseCreate">
          Dépense
        </v-btn>
      </template>
    </AgriPageCard>

    <v-dialog v-model="revenueDialog" persistent max-width="460">
      <v-card>
        <v-card-title class="agri-dialog-title">
          {{ editingRevenueId ? 'Modifier le revenu' : 'Nouveau revenu' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-text-field v-model="revenueForm.source" label="Source" outlined class="mb-2" />
          <v-text-field
            v-model.number="revenueForm.amount"
            label="Montant"
            type="number"
            min="0.01"
            step="0.01"
            outlined
            class="mb-2"
          />
          <v-text-field v-model="revenueForm.date" label="Date" type="date" outlined />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="success" variant="text" :loading="saving" @click="saveRevenue">
            Enregistrer
          </v-btn>
          <v-btn color="error" variant="text" @click="revenueDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="expenseDialog" persistent max-width="460">
      <v-card>
        <v-card-title class="agri-dialog-title">
          {{ editingExpenseId ? 'Modifier la dépense' : 'Nouvelle dépense' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-text-field v-model="expenseForm.category" label="Catégorie" outlined class="mb-2" />
          <v-text-field
            v-model.number="expenseForm.amount"
            label="Montant"
            type="number"
            min="0.01"
            step="0.01"
            outlined
            class="mb-2"
          />
          <v-text-field v-model="expenseForm.date" label="Date" type="date" outlined />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="error" variant="text" :loading="saving" @click="saveExpense">
            Enregistrer
          </v-btn>
          <v-btn color="grey" variant="text" @click="expenseDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { ExpenseDto, FinanceSummaryDto, RevenueDto } from '@agrimanage/shared';
import { ApiError } from '@agrimanage/api-client';

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const api = useApiClient();
const tab = ref('revenues');
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const formError = ref('');

const summary = ref<FinanceSummaryDto>({
  totalRevenue: 0,
  totalExpense: 0,
  balance: 0,
});
const revenues = ref<RevenueDto[]>([]);
const expenses = ref<ExpenseDto[]>([]);

const revenueDialog = ref(false);
const editingRevenueId = ref<string | null>(null);
const revenueForm = reactive({ source: '', amount: 0, date: todayInput() });

const expenseDialog = ref(false);
const editingExpenseId = ref<string | null>(null);
const expenseForm = reactive({ category: '', amount: 0, date: todayInput() });

onMounted(() => {
  void loadAll();
});

async function loadAll() {
  loading.value = true;
  error.value = '';
  try {
    const [summaryData, revenueData, expenseData] = await Promise.all([
      api.getFinanceSummary(),
      api.listRevenues(),
      api.listExpenses(),
    ]);
    summary.value = summaryData;
    revenues.value = revenueData;
    expenses.value = expenseData;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Chargement impossible';
  } finally {
    loading.value = false;
  }
}

function openRevenueCreate() {
  editingRevenueId.value = null;
  revenueForm.source = '';
  revenueForm.amount = 0;
  revenueForm.date = todayInput();
  formError.value = '';
  revenueDialog.value = true;
}

function openRevenueEdit(item: RevenueDto) {
  editingRevenueId.value = item.id;
  revenueForm.source = item.source;
  revenueForm.amount = item.amount;
  revenueForm.date = toDateInput(item.date);
  formError.value = '';
  revenueDialog.value = true;
}

async function saveRevenue() {
  if (!revenueForm.source.trim() || !revenueForm.amount || !revenueForm.date) {
    formError.value = 'Tous les champs sont obligatoires';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      source: revenueForm.source.trim(),
      amount: Number(revenueForm.amount),
      date: new Date(revenueForm.date).toISOString(),
    };
    if (editingRevenueId.value) {
      await api.updateRevenue(editingRevenueId.value, payload);
    } else {
      await api.createRevenue(payload);
    }
    revenueDialog.value = false;
    await loadAll();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

async function removeRevenue(item: RevenueDto) {
  if (!window.confirm(`Supprimer le revenu « ${item.source} » ?`)) return;
  try {
    await api.deleteRevenue(item.id);
    await loadAll();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  }
}

function openExpenseCreate() {
  editingExpenseId.value = null;
  expenseForm.category = '';
  expenseForm.amount = 0;
  expenseForm.date = todayInput();
  formError.value = '';
  expenseDialog.value = true;
}

function openExpenseEdit(item: ExpenseDto) {
  editingExpenseId.value = item.id;
  expenseForm.category = item.category;
  expenseForm.amount = item.amount;
  expenseForm.date = toDateInput(item.date);
  formError.value = '';
  expenseDialog.value = true;
}

async function saveExpense() {
  if (!expenseForm.category.trim() || !expenseForm.amount || !expenseForm.date) {
    formError.value = 'Tous les champs sont obligatoires';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      category: expenseForm.category.trim(),
      amount: Number(expenseForm.amount),
      date: new Date(expenseForm.date).toISOString(),
    };
    if (editingExpenseId.value) {
      await api.updateExpense(editingExpenseId.value, payload);
    } else {
      await api.createExpense(payload);
    }
    expenseDialog.value = false;
    await loadAll();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

async function removeExpense(item: ExpenseDto) {
  if (!window.confirm(`Supprimer la dépense « ${item.category} » ?`)) return;
  try {
    await api.deleteExpense(item.id);
    await loadAll();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR');
}

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}
</script>
