<template>
  <div ref="rootEl" class="relative inline-flex">
    <v-tooltip text="Notifications" location="bottom">
      <template #activator="{ props }">
        <button
          v-bind="props"
          ref="btnEl"
          type="button"
          class="notif-trigger relative rounded-full p-2 transition"
          :class="tone === 'light' ? 'notif-trigger--light' : 'notif-trigger--dark'"
          aria-label="Notifications"
          aria-haspopup="true"
          :aria-expanded="open"
          @click.stop.prevent="toggle"
        >
          <v-icon :class="unreadCount ? 'animate-soft-pulse' : ''">mdi-bell-outline</v-icon>
          <span v-if="unreadCount" class="notif-badge">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>
      </template>
    </v-tooltip>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelEl"
        class="notif-panel notif-panel--fixed"
        :style="panelStyle"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-[color:var(--agri-border)] bg-[color:var(--agri-mist)] px-4 py-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--agri-forest)]">Notifications</p>
            <p class="text-xs text-[color:var(--agri-muted)]">
              {{
                loading
                  ? 'Chargement…'
                  : connected
                    ? `${items.length} alerte${items.length > 1 ? 's' : ''} · historique conservé`
                    : error || 'Hors ligne'
              }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-full p-1 text-[color:var(--agri-muted)] hover:bg-white hover:text-[color:var(--agri-forest)]"
              title="Actualiser"
              @click="refresh(false)"
            >
              <v-icon size="18">mdi-refresh</v-icon>
            </button>
            <button
              v-if="unreadCount"
              type="button"
              class="text-xs font-medium text-[color:var(--agri-green)] hover:text-[color:var(--agri-forest)]"
              @click="onMarkAll"
            >
              Tout lire
            </button>
          </div>
        </div>

        <div class="notif-panel-body">
          <p v-if="error && !items.length" class="px-4 py-6 text-center text-sm text-red-700">
            {{ error }}
          </p>
          <p
            v-else-if="loading && !items.length"
            class="px-4 py-8 text-center text-sm text-[color:var(--agri-muted)]"
          >
            Chargement des alertes…
          </p>
          <p
            v-else-if="!items.length"
            class="px-4 py-8 text-center text-sm text-[color:var(--agri-muted)]"
          >
            Aucune alerte pour le moment.
          </p>

          <article
            v-for="item in items"
            :key="item.id"
            class="notif-item"
            :class="{ 'notif-item-unread': !item.readAt }"
          >
            <div class="mb-1.5 flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2">
                <v-icon size="18" :color="typeColor(item.type)">{{ typeIcon(item.type) }}</v-icon>
                <span class="text-sm font-semibold leading-snug text-[color:var(--agri-forest)]">
                  {{ item.title }}
                </span>
              </div>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="item.readAt ? 'notif-tag-read' : 'notif-tag-new'"
              >
                {{ item.readAt ? 'Lu' : 'Nouveau' }}
              </span>
            </div>

            <p class="notif-item-message">{{ item.message }}</p>

            <div class="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <p
                class="text-[11px] text-[color:var(--agri-muted)]"
                :title="formatDate(item.createdAt)"
              >
                {{ formatRelative(item.createdAt) }}
              </p>
              <div class="flex items-center gap-3">
                <button
                  v-if="!item.readAt"
                  type="button"
                  class="text-xs font-medium text-[color:var(--agri-muted)] hover:text-[color:var(--agri-forest)]"
                  @click="onMarkOne(item)"
                >
                  Marquer lu
                </button>
                <button
                  v-if="item.link"
                  type="button"
                  class="text-xs font-semibold text-[color:var(--agri-green)] hover:text-[color:var(--agri-forest)]"
                  @click="onOpenLink(item)"
                >
                  Ouvrir →
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast"
          class="notif-toast"
          @mouseenter="pauseToast"
          @mouseleave="resumeToast"
        >
          <div class="flex items-start gap-3">
            <v-icon color="warning">mdi-bell-ring</v-icon>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-[color:var(--agri-forest)]">{{ toast.title }}</p>
              <p class="mt-1 text-xs leading-relaxed text-[color:var(--agri-muted)]">
                {{ toast.message }}
              </p>
              <div class="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  class="text-xs font-semibold text-[color:var(--agri-green)]"
                  @click="openFromToast"
                >
                  Lire dans la cloche
                </button>
                <button
                  v-if="toast.link"
                  type="button"
                  class="text-xs font-medium text-[color:var(--agri-muted)] hover:text-[color:var(--agri-forest)]"
                  @click="onOpenLink(toast)"
                >
                  Ouvrir →
                </button>
              </div>
            </div>
            <button type="button" class="text-[color:var(--agri-muted)]" title="Fermer" @click="dismissToast">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { NotificationType, type NotificationDto } from '@agrimanage/shared';

withDefaults(
  defineProps<{
    tone?: 'light' | 'dark';
  }>(),
  { tone: 'light' },
);

const {
  items,
  unreadCount,
  toast,
  loading,
  error,
  connected,
  refresh,
  startRealtime,
  stopRealtime,
  markRead,
  markAllRead,
  dismissToast,
  pauseToast,
  resumeToast,
} = useNotifications();

const open = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const btnEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const panelStyle = ref<Record<string, string>>({});
let ignoreDocClickUntil = 0;

onMounted(() => {
  startRealtime();
  document.addEventListener('pointerdown', onDocPointer, true);
  window.addEventListener('resize', updatePanelPosition);
  window.addEventListener('scroll', updatePanelPosition, true);
});

onBeforeUnmount(() => {
  stopRealtime();
  document.removeEventListener('pointerdown', onDocPointer, true);
  window.removeEventListener('resize', updatePanelPosition);
  window.removeEventListener('scroll', updatePanelPosition, true);
});

async function toggle() {
  open.value = !open.value;
  if (open.value) {
    ignoreDocClickUntil = Date.now() + 250;
    await nextTick();
    updatePanelPosition();
    void refresh(false);
  }
}

function updatePanelPosition() {
  const btn = (btnEl.value as HTMLElement | null) ?? rootEl.value?.querySelector('button');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const width = Math.min(window.innerWidth - 16, 420);
  let left = rect.right - width;
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  const top = rect.bottom + 8;
  panelStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    zIndex: '4000',
  };
}

function onDocPointer(event: PointerEvent) {
  if (!open.value || Date.now() < ignoreDocClickUntil) return;
  const target = event.target as Node | null;
  if (!target) return;
  if (rootEl.value?.contains(target)) return;
  if (panelEl.value?.contains(target)) return;
  open.value = false;
}

async function onMarkAll() {
  await markAllRead();
}

async function onMarkOne(item: NotificationDto) {
  if (!item.readAt) await markRead(item.id);
}

async function onOpenLink(item: NotificationDto | null) {
  if (!item) return;
  if (!item.readAt) await markRead(item.id);
  dismissToast();
  open.value = false;
  if (item.link) await navigateTo(item.link);
}

function openFromToast() {
  dismissToast();
  open.value = true;
  ignoreDocClickUntil = Date.now() + 250;
  void nextTick().then(() => {
    updatePanelPosition();
    void refresh(false);
  });
}

function typeIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.LOW_STOCK:
      return 'mdi-package-variant-closed-remove';
    case NotificationType.HARVEST_REMINDER:
      return 'mdi-barley';
    case NotificationType.ACTIVITY_REMINDER:
      return 'mdi-calendar-clock';
    case NotificationType.SUPPORT_REPLY:
      return 'mdi-lifebuoy';
    default:
      return 'mdi-bell';
  }
}

function typeColor(type: NotificationType) {
  switch (type) {
    case NotificationType.LOW_STOCK:
      return 'warning';
    case NotificationType.HARVEST_REMINDER:
      return 'success';
    case NotificationType.ACTIVITY_REMINDER:
      return 'info';
    case NotificationType.SUPPORT_REPLY:
      return 'primary';
    default:
      return 'secondary';
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'À l’instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
</script>

<style scoped>
.notif-trigger--dark {
  color: #fff;
}
.notif-trigger--dark:hover {
  background: rgba(255, 255, 255, 0.15);
}
.notif-trigger--light {
  color: var(--agri-forest);
}
.notif-trigger--light:hover {
  background: var(--agri-sky);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
