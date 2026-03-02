import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useAdminStore } from '@/stores/admin.store';

const requiresAuth = (route: RouteLocationNormalized): boolean =>
  route.matched.some((record) => record.meta?.requiresAuth);

const requiresAdmin = (route: RouteLocationNormalized): boolean =>
  route.matched.some((record) => record.meta?.requiresAdmin);

const resolveRestaurantContext = (route: RouteLocationNormalized): string | number | null => {
  const param = route.params.restaurantId ?? route.query.restaurantId;
  if (Array.isArray(param)) {
    return param[0];
  }
  return (param as string | number | undefined) ?? null;
};

export const requireAuthGuard = async (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> => {
  const authStore = useAuthStore();

  if (requiresAuth(to) && !authStore.isAuthenticated) {
    next({ name: 'login', query: { reason: 'unauthorized', redirect: to.fullPath } });
    return;
  }

  if (requiresAdmin(to)) {
    const restaurantContext = resolveRestaurantContext(to);
    if (!restaurantContext) {
      next({ name: 'permission-denied', query: { reason: 'missing-restaurant' } });
      return;
    }

    const adminStore = useAdminStore();
    try {
      await adminStore.refreshAdmins(restaurantContext);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 403) {
        next({ name: 'permission-denied', query: { from: to.fullPath } });
        return;
      }
      next({ name: 'restaurants-list', query: { reason: 'admin-guard-failed' } });
      return;
    }
  }

  next();
};
