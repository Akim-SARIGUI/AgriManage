<template>
  <span class="agri-icon-action">
    <v-tooltip :text="label" location="top">
      <template #activator="{ props: tip }">
        <v-btn
          v-bind="tip"
          :size="size"
          :color="color"
          :variant="variant"
          :loading="loading"
          :disabled="disabled"
          :to="to"
          icon
          class="agri-icon-btn"
          @click="emit('click', $event)"
        >
          <v-icon :icon="icon" />
        </v-btn>
      </template>
    </v-tooltip>
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    label: string;
    color?: string;
    size?: string | number;
    variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain';
    loading?: boolean;
    disabled?: boolean;
    to?: string;
  }>(),
  {
    color: 'primary',
    size: 'small',
    variant: 'flat',
    loading: false,
    disabled: false,
    to: undefined,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<style scoped>
.agri-icon-action {
  display: inline-flex;
  vertical-align: middle;
}
</style>
