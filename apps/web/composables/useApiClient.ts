import { AgriManageApiClient, isSessionError } from '@agrimanage/api-client';
import type { AuthUser } from '@agrimanage/shared';

let client: AgriManageApiClient | null = null;
let clientBaseUrl = '';
let redirecting = false;

export function useApiClient() {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase as string;

  if (!client || clientBaseUrl !== baseUrl) {
    clientBaseUrl = baseUrl;
    client = new AgriManageApiClient({
      baseUrl,
      onUnauthorized: handleSessionExpired,
    });
  }

  return client;
}

/** Message UI : vide si session expirée (redirect en cours). */
export function toUiError(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (isSessionError(error)) return '';
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function handleSessionExpired() {
  if (!import.meta.client || redirecting) return;
  redirecting = true;

  try {
    const user = useState<AuthUser | null>('auth-user');
    user.value = null;

    const path = window.location.pathname;
    const onAuthPage =
      path.startsWith('/auth/') || path === '/admin/login' || path === '/connection';

    if (onAuthPage) return;

    const target = path.startsWith('/admin') ? '/admin/login' : '/auth/login';
    await navigateTo(target, { replace: true });
  } finally {
    window.setTimeout(() => {
      redirecting = false;
    }, 800);
  }
}
