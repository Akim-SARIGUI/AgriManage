<template>
  <div class="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
    <v-card class="w-full pa-6" elevation="2">
      <h1 class="mb-2 text-2xl font-semibold text-agri-green">Mot de passe oublié</h1>
      <p class="mb-6 text-sm text-agri-ink/70">
        Recevez un code de réinitialisation (affiché en console API en développement).
      </p>

      <v-alert v-if="message" type="success" class="mb-4" density="compact">{{ message }}</v-alert>
      <v-alert v-if="error" type="error" class="mb-4" density="compact">{{ error }}</v-alert>

      <v-form @submit.prevent="onSubmit">
        <v-text-field v-model="email" label="Email" type="email" required class="mb-4" />
        <v-btn type="submit" color="primary" block :loading="loading">Envoyer le code</v-btn>
      </v-form>

      <p class="mt-4 text-sm">
        <NuxtLink to="/auth/reset-password" class="text-agri-leaf">J'ai mon code</NuxtLink>
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const api = useApiClient();
const email = ref('');
const loading = ref(false);
const error = ref('');
const message = ref('');

async function onSubmit() {
  loading.value = true;
  error.value = '';
  message.value = '';
  try {
    await api.requestPasswordReset(email.value);
    message.value = 'Si un compte existe, un code a été généré.';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur';
  } finally {
    loading.value = false;
  }
}
</script>
