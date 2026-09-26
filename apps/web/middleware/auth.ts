import { Role } from '@agrimanage/shared';

export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchMe } = useAuth();

  // Toujours revalider la session (évite un user en mémoire avec cookies expirés)
  await fetchMe();

  if (!user.value) {
    return navigateTo('/auth/login');
  }
  // Admin : pas d’accès à l’espace agriculteur / données métier
  if (user.value.role === Role.ADMIN) {
    return navigateTo('/admin');
  }
});
