<template>
  <div class="space-y-4">
    <v-card class="agri-page-card elevation-8 pa-6">
      <div class="flex flex-wrap items-center gap-4">
        <v-avatar size="72" color="primary">
          <span class="text-h5 font-weight-bold text-white">{{ initials }}</span>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">{{ user?.fullName }}</h1>
          <p class="text-medium-emphasis">{{ user?.email }}</p>
        </div>
      </div>
    </v-card>

    <v-alert v-if="error" type="error" density="comfortable">{{ error }}</v-alert>
    <v-alert v-if="success" type="success" density="comfortable">{{ success }}</v-alert>

    <v-row>
      <v-col cols="12" md="6">
        <AgriPageCard title="Informations Personnelles" icon="mdi-account">
          <div class="mb-4 space-y-2">
            <p><strong>Nom :</strong> {{ user?.fullName }}</p>
            <p><strong>Email :</strong> {{ user?.email }}</p>
            <p><strong>Rôle :</strong> {{ user?.role }}</p>
          </div>
          <v-btn color="primary" class="mb-2" block @click="editDialog = true">
            Modifier mes données
          </v-btn>
        </AgriPageCard>
      </v-col>
      <v-col cols="12" md="6">
        <AgriPageCard title="Paramètres" icon="mdi-cog">
          <v-btn color="success" class="mb-3" block @click="passwordDialog = true">
            Changer le Mot de Passe
          </v-btn>
          <v-btn color="error" class="mb-3" block variant="tonal" @click="onLogout">
            Déconnexion
          </v-btn>
          <p class="text-caption text-medium-emphasis">
            Mot de passe oublié ?
            <NuxtLink to="/auth/forgot-password" class="text-primary">Réinitialiser</NuxtLink>
          </p>
        </AgriPageCard>
      </v-col>
    </v-row>

    <v-dialog v-model="editDialog" max-width="560">
      <v-card>
        <v-card-title class="agri-dialog-title">Modifier l’Utilisateur</v-card-title>
        <v-card-text class="pt-4">
          <v-text-field v-model="profileForm.fullName" label="Nom Complet" outlined class="mb-2" />
          <v-text-field v-model="profileForm.email" label="Email" type="email" outlined />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" :loading="savingProfile" @click="saveProfile">
            Modifier
          </v-btn>
          <v-btn color="grey" variant="text" @click="editDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="passwordDialog" max-width="560">
      <v-card>
        <v-card-title class="agri-dialog-title">Changer le Mot de Passe</v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="passwordForm.currentPassword"
            label="Mot de passe actuel"
            type="password"
            outlined
            class="mb-2"
          />
          <v-text-field
            v-model="passwordForm.newPassword"
            label="Nouveau mot de passe"
            type="password"
            outlined
            class="mb-2"
            hint="Au moins 8 caractères"
            persistent-hint
          />
          <v-text-field
            v-model="passwordForm.confirmPassword"
            label="Confirmer"
            type="password"
            outlined
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" :loading="savingPassword" @click="savePassword">
            Mettre à jour
          </v-btn>
          <v-btn color="grey" variant="text" @click="passwordDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ApiError } from '@agrimanage/api-client';

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const { user, updateProfile, changePassword, fetchMe, logout } = useAuth();

const error = ref('');
const success = ref('');
const savingProfile = ref(false);
const savingPassword = ref(false);
const editDialog = ref(false);
const passwordDialog = ref(false);

const profileForm = reactive({
  fullName: '',
  email: '',
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const initials = computed(() => {
  const name = user.value?.fullName?.trim() || 'A';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
});

onMounted(async () => {
  if (!user.value) await fetchMe();
  profileForm.fullName = user.value?.fullName ?? '';
  profileForm.email = user.value?.email ?? '';
});

watch(
  () => user.value,
  (value) => {
    if (!value) return;
    profileForm.fullName = value.fullName;
    profileForm.email = value.email;
  },
);

async function saveProfile() {
  error.value = '';
  success.value = '';
  if (!profileForm.fullName.trim() || !profileForm.email.trim()) {
    error.value = 'Nom et email sont obligatoires';
    return;
  }
  savingProfile.value = true;
  try {
    await updateProfile({
      fullName: profileForm.fullName.trim(),
      email: profileForm.email.trim(),
    });
    editDialog.value = false;
    success.value = 'Profil mis à jour.';
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    savingProfile.value = false;
  }
}

async function savePassword() {
  error.value = '';
  success.value = '';
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    error.value = 'Renseignez les mots de passe';
    return;
  }
  if (passwordForm.newPassword.length < 8) {
    error.value = 'Le nouveau mot de passe doit contenir au moins 8 caractères';
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = 'La confirmation ne correspond pas';
    return;
  }
  savingPassword.value = true;
  try {
    await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    passwordDialog.value = false;
    success.value = 'Mot de passe mis à jour.';
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erreur';
  } finally {
    savingPassword.value = false;
  }
}

async function onLogout() {
  await logout();
  await navigateTo('/auth/login');
}
</script>
