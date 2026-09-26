<template>
  <div class="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
    <v-card class="w-full rounded-2xl border border-[color:var(--agri-border)] pa-6" elevation="2">
      <div class="mb-5 flex items-center gap-3">
        <img
          src="/agrimanage-icon.png"
          alt=""
          width="44"
          height="44"
          class="rounded-xl shadow-agri"
        />
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-agri-muted">AgriManage</p>
          <h1 class="text-2xl font-semibold text-agri-forest">Créer un compte</h1>
        </div>
      </div>
      <p class="mb-6 text-sm text-agri-muted">Inscription agriculteur.</p>

      <v-alert v-if="error" type="error" class="mb-4" density="compact">{{ error }}</v-alert>

      <v-form @submit.prevent="onSubmit">
        <v-text-field v-model="fullName" label="Nom complet" required class="mb-2" />
        <v-text-field v-model="email" label="Email" type="email" required class="mb-2" />
        <v-text-field
          v-model="password"
          label="Mot de passe (min. 8)"
          type="password"
          required
          class="mb-4"
        />
        <v-btn type="submit" color="primary" block :loading="loading">S'inscrire</v-btn>
      </v-form>

      <p class="mt-4 text-sm">
        Déjà un compte ?
        <NuxtLink to="/auth/login" class="text-agri-leaf">Se connecter</NuxtLink>
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const { register } = useAuth();
const fullName = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    await register({
      fullName: fullName.value,
      email: email.value,
      password: password.value,
    });
    await navigateTo('/app');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Inscription impossible';
  } finally {
    loading.value = false;
  }
}
</script>
