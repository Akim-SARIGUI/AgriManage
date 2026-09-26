<template>
  <v-card class="agri-page-card elevation-8" :class="cardClass">
    <v-card-title v-if="title" class="agri-card-title">
      <v-icon v-if="icon" class="mr-2" size="22">{{ icon }}</v-icon>
      <span>{{ title }}</span>
      <v-spacer />
      <slot name="title-actions" />
    </v-card-title>
    <v-card-subtitle v-if="subtitle" class="agri-card-subtitle">
      {{ subtitle }}
    </v-card-subtitle>
    <v-card-text :class="['agri-card-body', bodyClass]">
      <slot />
    </v-card-text>
    <v-card-actions v-if="$slots.actions" class="agri-card-actions">
      <v-spacer />
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    icon?: string;
    cardClass?: string;
    bodyClass?: string;
  }>(),
  {
    title: '',
    subtitle: '',
    icon: '',
    cardClass: '',
    bodyClass: '',
  },
);
</script>
