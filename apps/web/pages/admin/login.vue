<template>
  <div class="agri-auth-shell">
    <div class="agri-auth-card">
      <div class="mb-6 text-center">
        <div class="mb-3 flex justify-center">
          <img
            src="/agrimanage-icon.png"
            alt="AgriManage"
            width="56"
            height="56"
            class="rounded-xl shadow-agri"
          />
        </div>
        <p class="font-display text-sm font-semibold uppercase tracking-[0.2em] text-agri-wheat">
          AgriManage · Admin
        </p>
        <h1 class="mt-2 font-display text-3xl text-agri-forest">Espace administration</h1>
        <p class="mt-2 text-sm text-agri-muted">
          Accès réservé aux administrateurs de la plateforme.
        </p>
      </div>

      <v-alert v-if="error" type="error" class="mb-4" density="compact">{{ error }}</v-alert>

      <v-form @submit.prevent="onSubmit">
        <v-text-field
          v-model="email"
          label="Email administrateur"
          type="email"
          required
          variant="outlined"
          prepend-inner-icon="mdi-shield-account"
          class="mb-2"
          autocomplete="username"
        />
        <v-text-field
          v-model="password"
          label="Mot de passe"
          type="password"
          required
          variant="outlined"
          prepend-inner-icon="mdi-lock-outline"
          class="mb-4"
          autocomplete="current-password"
        />
        <v-btn type="submit" color="primary" block size="large" rounded="lg" :loading="loading">
          Se connecter
        </v-btn>
      </v-form>

      <div class="mt-5 text-center text-sm">
        <NuxtLink to="/auth/login" class="text-agri-muted hover:text-agri-forest">
          Connexion agriculteur →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Role } from '@agrimanage/shared';

definePageMeta({
  layout: 'landing',
});

const { adminLogin, user, fetchMe } = useAuth();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

onMounted(async () => {
  if (!user.value) await fetchMe();
  if (user.value?.role === Role.ADMIN) {
    await navigateTo('/admin', { replace: true });
  }
});

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    const account = await adminLogin(email.value, password.value);
    if (account.role !== Role.ADMIN) {
      error.value = 'Ce compte n’a pas les droits administrateur.';
      return;
    }
    await navigateTo('/admin');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Connexion administrateur impossible';
  } finally {
    loading.value = false;
  }
}
</script>
