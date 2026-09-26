<template>
  <div>
    <v-alert v-if="error" type="error" density="comfortable" class="mb-4">{{ error }}</v-alert>
    <v-alert
      v-if="success"
      type="success"
      density="comfortable"
      class="mb-4"
      closable
      @click:close="success = ''"
    >
      {{ success }}
    </v-alert>

    <AgriPageCard title="Gestion des utilisateurs" icon="mdi-account-group">
      <template #title-actions>
        <v-btn size="small" variant="text" color="white" prepend-icon="mdi-account-plus" @click="openCreate(Role.USER)">
          Utilisateur
        </v-btn>
        <v-btn size="small" variant="text" color="white" prepend-icon="mdi-shield-account" @click="openCreate(Role.ADMIN)">
          Admin
        </v-btn>
      </template>

      <div class="mb-4 flex flex-wrap items-end gap-3">
        <v-text-field
          v-model="search"
          label="Rechercher (nom ou email)"
          prepend-inner-icon="mdi-magnify"
          clearable
          density="comfortable"
          variant="outlined"
          hide-details
          class="min-w-[220px] grow"
        />
        <v-select
          v-model="roleFilter"
          :items="roleFilterOptions"
          item-title="title"
          item-value="value"
          label="Rôle"
          clearable
          density="comfortable"
          variant="outlined"
          hide-details
          class="max-w-[180px] grow"
        />
        <v-select
          v-model="lockFilter"
          :items="lockFilterOptions"
          item-title="title"
          item-value="value"
          label="Statut"
          clearable
          density="comfortable"
          variant="outlined"
          hide-details
          class="max-w-[180px] grow"
        />
        <v-btn
          variant="tonal"
          color="primary"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="loadUsers"
        >
          Actualiser
        </v-btn>
      </div>

      <div v-if="loading" class="pa-8 text-center text-medium-emphasis">Chargement…</div>

      <v-alert
        v-else-if="filteredUsers.length === 0"
        type="info"
        variant="tonal"
        density="comfortable"
      >
        {{ users.length === 0 ? 'Aucun utilisateur pour le moment.' : 'Aucun résultat pour ces filtres.' }}
      </v-alert>

      <template v-else>
        <v-table class="agri-table elevation-1">
          <thead>
            <tr>
              <th class="text-left">Nom</th>
              <th class="text-left">Email</th>
              <th class="text-left">Rôle</th>
              <th class="text-left">Statut</th>
              <th class="text-left">Créé le</th>
              <th class="agri-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pagedUsers" :key="item.id">
              <td class="font-medium">{{ item.fullName }}</td>
              <td>{{ item.email }}</td>
              <td>
                <v-chip
                  size="small"
                  :color="item.role === Role.ADMIN ? 'secondary' : 'success'"
                  variant="tonal"
                >
                  {{ item.role === Role.ADMIN ? 'Admin' : 'Utilisateur' }}
                </v-chip>
              </td>
              <td>
                <v-chip v-if="isLocked(item)" size="small" color="error" variant="tonal">
                  Verrouillé
                </v-chip>
                <span v-else class="text-sm text-medium-emphasis">Actif</span>
              </td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td class="agri-col-actions">
                <div class="agri-fab-actions">
                  <IconAction icon="mdi-eye" label="Voir" color="info" @click="openView(item)" />
                  <IconAction
                    icon="mdi-pencil"
                    label="Modifier"
                    color="secondary"
                    @click="openEdit(item)"
                  />
                  <IconAction
                    v-if="isLocked(item)"
                    icon="mdi-lock-open"
                    label="Déverrouiller"
                    color="warning"
                    @click="unlockUser(item)"
                  />
                  <IconAction
                    icon="mdi-delete"
                    label="Supprimer"
                    color="error"
                    :disabled="item.id === currentUserId"
                    @click="confirmDelete(item)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div
          v-if="filteredUsers.length > pageSize"
          class="mt-4 flex flex-wrap items-center justify-between gap-3"
        >
          <p class="text-sm text-[color:var(--agri-muted)]">
            {{ filteredUsers.length }} utilisateur(s) · page {{ page }} / {{ pageCount }}
          </p>
          <v-pagination
            v-model="page"
            :length="pageCount"
            density="comfortable"
            total-visible="5"
            color="primary"
          />
        </div>
      </template>
    </AgriPageCard>

    <v-dialog v-model="formDialog" max-width="560">
      <v-card class="pa-4">
        <v-card-title>
          {{ editingId ? 'Modifier l’utilisateur' : 'Nouvel utilisateur' }}
        </v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" class="mb-3" density="compact">
            {{ formError }}
          </v-alert>
          <v-text-field v-model="form.fullName" label="Nom complet" class="mb-2" />
          <v-text-field v-model="form.email" label="Email" type="email" class="mb-2" />
          <v-select
            v-model="form.role"
            :items="roleOptions"
            item-title="title"
            item-value="value"
            label="Rôle"
            class="mb-2"
          />
          <v-text-field
            v-model="form.password"
            :label="editingId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'"
            type="password"
            :required="!editingId"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="formDialog = false">Annuler</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="viewDialog" max-width="480">
      <v-card class="pa-4" v-if="selected">
        <v-card-title>Détails de l’utilisateur</v-card-title>
        <v-card-text class="space-y-2">
          <p><strong>Nom :</strong> {{ selected.fullName }}</p>
          <p><strong>Email :</strong> {{ selected.email }}</p>
          <p><strong>Rôle :</strong> {{ selected.role === Role.ADMIN ? 'Admin' : 'Utilisateur' }}</p>
          <p><strong>Tentatives login :</strong> {{ selected.loginAttempts }}</p>
          <p>
            <strong>Verrouillage :</strong>
            {{ selected.lockedUntil ? formatDateTime(selected.lockedUntil) : 'Non' }}
          </p>
          <p><strong>Créé le :</strong> {{ formatDateTime(selected.createdAt) }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="viewDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { Role, type AdminUserDto } from '@agrimanage/shared';
import { ApiError } from '@agrimanage/api-client';

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
});

const api = useApiClient();
const { user } = useAuth();
const currentUserId = computed(() => user.value?.id);

const users = ref<AdminUserDto[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');
const formError = ref('');
const search = ref('');
const roleFilter = ref<Role | null>(null);
const lockFilter = ref<'locked' | 'active' | null>(null);
const page = ref(1);
const pageSize = 10;

const formDialog = ref(false);
const viewDialog = ref(false);
const editingId = ref<string | null>(null);
const selected = ref<AdminUserDto | null>(null);

const form = reactive({
  fullName: '',
  email: '',
  role: Role.USER as Role,
  password: '',
});

const roleOptions = [
  { title: 'Utilisateur', value: Role.USER },
  { title: 'Administrateur', value: Role.ADMIN },
];

const roleFilterOptions = [
  { title: 'Utilisateurs', value: Role.USER },
  { title: 'Administrateurs', value: Role.ADMIN },
];

const lockFilterOptions = [
  { title: 'Actifs', value: 'active' },
  { title: 'Verrouillés', value: 'locked' },
];

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase();
  return users.value.filter((item) => {
    if (roleFilter.value && item.role !== roleFilter.value) return false;
    if (lockFilter.value === 'locked' && !isLocked(item)) return false;
    if (lockFilter.value === 'active' && isLocked(item)) return false;
    if (!q) return true;
    return `${item.fullName} ${item.email}`.toLowerCase().includes(q);
  });
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize)));

const pagedUsers = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredUsers.value.slice(start, start + pageSize);
});

watch([search, roleFilter, lockFilter], () => {
  page.value = 1;
});

onMounted(() => {
  void loadUsers();
});

async function loadUsers() {
  loading.value = true;
  error.value = '';
  try {
    users.value = await api.listAdminUsers();
  } catch (err) {
    users.value = [];
    error.value = err instanceof Error ? err.message : 'Chargement impossible';
  } finally {
    loading.value = false;
  }
}

function openCreate(role: Role) {
  editingId.value = null;
  form.fullName = '';
  form.email = '';
  form.role = role;
  form.password = '';
  formError.value = '';
  formDialog.value = true;
}

function openEdit(item: AdminUserDto) {
  editingId.value = item.id;
  form.fullName = item.fullName;
  form.email = item.email;
  form.role = item.role;
  form.password = '';
  formError.value = '';
  formDialog.value = true;
}

function openView(item: AdminUserDto) {
  selected.value = item;
  viewDialog.value = true;
}

async function save() {
  if (!form.fullName.trim() || !form.email.trim()) {
    formError.value = 'Nom et email obligatoires';
    return;
  }
  if (!editingId.value && form.password.length < 8) {
    formError.value = 'Mot de passe : 8 caractères minimum';
    return;
  }

  saving.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await api.updateAdminUser(editingId.value, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      });
      success.value = 'Utilisateur mis à jour.';
    } else {
      await api.createAdminUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      success.value = 'Utilisateur créé.';
    }
    formDialog.value = false;
    await loadUsers();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    saving.value = false;
  }
}

async function unlockUser(item: AdminUserDto) {
  try {
    await api.unlockAdminUser(item.id);
    success.value = `Compte « ${item.fullName} » déverrouillé.`;
    await loadUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Déverrouillage impossible';
  }
}

async function confirmDelete(item: AdminUserDto) {
  if (!window.confirm(`Supprimer le compte « ${item.fullName} » ?`)) return;
  try {
    await api.deleteAdminUser(item.id);
    success.value = 'Compte supprimé.';
    await loadUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Suppression impossible';
  }
}

function isLocked(item: AdminUserDto) {
  return Boolean(item.lockedUntil && new Date(item.lockedUntil) > new Date());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR');
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('fr-FR');
}
</script>
