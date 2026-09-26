<template>
  <NuxtLink :to="to" class="agri-brand" :class="{ 'agri-brand--light': light }">
    <img
      :src="markSrc"
      alt=""
      class="agri-brand__mark"
      :width="size"
      :height="size"
      decoding="async"
    />
    <span v-if="showName" class="agri-brand__text">
      <span class="agri-brand__name">AgriManage</span>
      <span v-if="tagline" class="agri-brand__tagline">{{ tagline }}</span>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    to?: string;
    size?: number;
    showName?: boolean;
    tagline?: string;
    light?: boolean;
    variant?: 'svg' | 'png';
  }>(),
  {
    to: '/',
    size: 36,
    showName: true,
    tagline: '',
    light: false,
    variant: 'svg',
  },
);

const markSrc = computed(() =>
  props.variant === 'png' ? '/agrimanage-icon.png' : '/agrimanage-mark.svg',
);
</script>

<style scoped>
.agri-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.agri-brand__mark {
  flex-shrink: 0;
  border-radius: 0.65rem;
  box-shadow: 0 4px 14px rgba(27, 67, 50, 0.18);
}

.agri-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.agri-brand__name {
  font-family: Poppins, Roboto, 'Segoe UI', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--agri-forest);
}

.agri-brand__tagline {
  margin-top: 0.15rem;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--agri-muted);
}

.agri-brand--light .agri-brand__name {
  color: #fff;
}

.agri-brand--light .agri-brand__tagline {
  color: rgba(255, 255, 255, 0.7);
}

.agri-brand--light .agri-brand__mark {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}
</style>
