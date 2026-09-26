<script setup lang="ts">
definePageMeta({
  layout: 'landing',
});

await navigateTo('/auth/login', { replace: true });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-agri-mist text-agri-muted">
    Redirection vers la connexion…
  </div>
</template>
