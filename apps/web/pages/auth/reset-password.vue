<template>
  <div class="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
    <v-card class="w-full pa-6" elevation="2">
      <h1 class="mb-2 text-2xl font-semibold text-agri-green">Nouveau mot de passe</h1>

      <v-alert v-if="message" type="success" class="mb-4" density="compact">{{ message }}</v-alert>
      <v-alert v-if="error" type="error" class="mb-4" density="compact">{{ error }}</v-alert>

      <v-form @submit.prevent="onSubmit">
        <v-text-field v-model="email" label="Email" type="email" required class="mb-2" />
        <v-text-field v-model="code" label="Code (6 chiffres)" required class="mb-2" />
        <v-text-field
          v-model="newPassword"
          label="Nouveau mot de passe"
          type="password"
          required
          class="mb-4"
        />
        <v-btn type="submit" color="primary" block :loading="loading">Réinitialiser</v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const api = useApiClient();
const email = ref('');
const code = ref('');
const newPassword = ref('');
const loading = ref(false);
const error = ref('');
const message = ref('');

async function onSubmit() {
  loading.value = true;
  error.value = '';
  message.value = '';
  try {
    await api.resetPassword({
      email: email.value,
      code: code.value,
      newPassword: newPassword.value,
    });
    message.value = 'Mot de passe mis à jour. Vous pouvez vous connecter.';
    await navigateTo('/auth/login');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur';
  } finally {
    loading.value = false;
  }
}
</script>
