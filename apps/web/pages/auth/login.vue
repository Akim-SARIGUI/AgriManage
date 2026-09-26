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
          AgriManage
        </p>
        <h1 class="mt-2 font-display text-3xl text-agri-forest">Connexion</h1>
        <p class="mt-2 text-sm text-agri-muted">
          Un seul accès : vous êtes redirigé selon votre rôle.
        </p>
      </div>

      <v-alert v-if="error" type="error" class="mb-4" density="compact">{{ error }}</v-alert>

      <v-form @submit.prevent="onSubmit">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          required
          variant="outlined"
          class="mb-2"
        />
        <v-text-field
          v-model="password"
          label="Mot de passe"
          type="password"
          required
          variant="outlined"
          class="mb-4"
        />
        <v-btn type="submit" color="primary" block size="large" rounded="lg" :loading="loading">
          Se connecter
        </v-btn>
      </v-form>

      <div class="mt-5 flex justify-between text-sm">
        <NuxtLink to="/auth/register" class="font-medium text-agri-green hover:text-agri-forest">
          Créer un compte
        </NuxtLink>
        <NuxtLink to="/auth/forgot-password" class="text-agri-muted hover:text-agri-forest">
          Mot de passe oublié
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

const { login } = useAuth();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    const account = await login(email.value, password.value);
    await navigateTo(account.role === Role.ADMIN ? '/admin' : '/app');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Connexion impossible';
  } finally {
    loading.value = false;
  }
}
</script>
