import { Role } from '@agrimanage/shared';

export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchMe } = useAuth();

  await fetchMe();

  if (!user.value) {
    return navigateTo('/admin/login');
  }
  if (user.value.role !== Role.ADMIN) {
    return navigateTo('/app');
  }
});
