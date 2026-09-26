import type { NotificationDto, NotificationsFeedDto } from '@agrimanage/shared';

const TOAST_DURATION_MS = 14_000;
const POLL_MS = 20_000;

/** Singleton : évite plusieurs timers si le composable est remounté (HMR / layout). */
let pollTimer: ReturnType<typeof setInterval> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let knownIds = new Set<string>();
let started = false;
let inFlight = false;
let toastPaused = false;
let toastRemaining = TOAST_DURATION_MS;
let toastStartedAt = 0;
let subscribers = 0;

export function useNotifications() {
  const api = useApiClient();
  const items = useState<NotificationDto[]>('notif-items', () => []);
  const unreadCount = useState('notif-unread', () => 0);
  const toast = useState<NotificationDto | null>('notif-toast', () => null);
  const loading = useState('notif-loading', () => false);
  const error = useState('notif-error', () => '');
  const connected = useState('notif-connected', () => false);

  function clearToastTimer() {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
  }

  function scheduleToastDismiss(ms = toastRemaining) {
    clearToastTimer();
    toastStartedAt = Date.now();
    toastRemaining = ms;
    toastTimer = setTimeout(() => {
      if (!toastPaused) toast.value = null;
    }, ms);
  }

  function showToast(item: NotificationDto) {
    toast.value = item;
    toastRemaining = TOAST_DURATION_MS;
    toastPaused = false;
    scheduleToastDismiss();
  }

  function pauseToast() {
    if (!toast.value || toastPaused) return;
    toastPaused = true;
    toastRemaining = Math.max(2_000, toastRemaining - (Date.now() - toastStartedAt));
    clearToastTimer();
  }

  function resumeToast() {
    if (!toast.value || !toastPaused) return;
    toastPaused = false;
    scheduleToastDismiss(toastRemaining);
  }

  function applyFeed(feed: NotificationsFeedDto, announce = true) {
    const newest = feed.items.find((item) => !knownIds.has(item.id) && !item.readAt);
    for (const item of feed.items) knownIds.add(item.id);
    items.value = [...feed.items].sort((a, b) => {
      const unreadDiff = Number(!a.readAt) - Number(!b.readAt);
      if (unreadDiff !== 0) return -unreadDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    unreadCount.value = feed.unreadCount;
    error.value = '';
    if (announce && newest) showToast(newest);
  }

  async function refresh(announce = false) {
    if (inFlight) return;
    inFlight = true;
    if (!announce) loading.value = true;
    try {
      const feed = await api.listNotifications();
      applyFeed(feed, announce);
      connected.value = true;
    } catch (err) {
      connected.value = false;
      const message =
        err instanceof Error ? err.message : 'Impossible de charger les notifications';
      // Ne pas spammer l’UI pour le rate-limit pendant le polling silencieux
      if (!announce || !/too many requests|throttle/i.test(message)) {
        error.value = message;
      }
    } finally {
      loading.value = false;
      inFlight = false;
    }
  }

  function startRealtime() {
    if (!import.meta.client) return;
    subscribers += 1;

    if (started) {
      void refresh(false);
      return;
    }

    started = true;
    knownIds = new Set(items.value.map((item) => item.id));
    void refresh(false);

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      void refresh(true);
    }, POLL_MS);
  }

  function stopRealtime() {
    subscribers = Math.max(0, subscribers - 1);
    if (subscribers > 0) return;

    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    clearToastTimer();
    started = false;
    connected.value = false;
  }

  async function markRead(id: string) {
    try {
      await api.markNotificationRead(id);
      await refresh(false);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lecture impossible';
    }
  }

  async function markAllRead() {
    try {
      await api.markAllNotificationsRead();
      await refresh(false);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lecture impossible';
    }
  }

  function dismissToast() {
    clearToastTimer();
    toast.value = null;
    toastPaused = false;
  }

  return {
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
  };
}
