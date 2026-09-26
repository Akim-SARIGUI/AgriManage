import type { AuthUser } from '@agrimanage/shared';
import { Role } from '@agrimanage/shared';
import { ApiError, isSessionError } from '@agrimanage/api-client';

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null);
  const loading = useState('auth-loading', () => false);
  const api = useApiClient();

  async function fetchMe() {
    loading.value = true;
    try {
      user.value = await api.me();
      return user.value;
    } catch (error) {
      // Session morte uniquement : ne pas déconnecter sur un simple souci réseau
      if (isSessionError(error) || (error instanceof ApiError && error.statusCode === 401)) {
        user.value = null;
      }
      return user.value;
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    user.value = await api.login({ email, password });
    return user.value;
  }

  async function adminLogin(email: string, password: string) {
    user.value = await api.adminLogin({ email, password });
    return user.value;
  }

  async function register(payload: { email: string; fullName: string; password: string }) {
    await api.register(payload);
    return login(payload.email, payload.password);
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      user.value = null;
    }
  }

  async function updateProfile(payload: { fullName?: string; email?: string }) {
    user.value = await api.updateProfile(payload);
    return user.value;
  }

  async function changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }) {
    return api.changePassword(payload);
  }

  const isAdmin = computed(() => user.value?.role === Role.ADMIN);

  return {
    user,
    loading,
    isAdmin,
    fetchMe,
    login,
    adminLogin,
    register,
    logout,
    updateProfile,
    changePassword,
  };
}
