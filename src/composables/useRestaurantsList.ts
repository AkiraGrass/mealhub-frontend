import { computed, ref, watch } from 'vue';
import { fetchRestaurantsApi } from '@/services/api/restaurants.api';
import type { RestaurantSummary } from '@/types/restaurant';
import { trackEvent } from '@/utils/telemetry';

export const computeEmptyState = (loading: boolean, error: string | null, total: number): boolean => {
  return !loading && !error && total === 0;
};

export const useRestaurantsList = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const timeout = ref(false);
  const permissionDenied = ref(false);
  const items = ref<RestaurantSummary[]>([]);
  const page = ref(1);
  const perPage = ref(10);
  const total = ref(0);
  const lastPage = ref(1);

  const empty = computed(
    () => !timeout.value && !permissionDenied.value && computeEmptyState(loading.value, error.value, items.value.length)
  );

  const load = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    timeout.value = false;
    permissionDenied.value = false;
    try {
      const result = await fetchRestaurantsApi(page.value, perPage.value);
      items.value = result.items;
      total.value = result.meta.total;
      lastPage.value = result.meta.lastPage;
      trackEvent('restaurants_list_success', { page: page.value, count: items.value.length });
    } catch (caught) {
      const status = (caught as { response?: { status?: number } }).response?.status;
      const code = (caught as { code?: string }).code;
      timeout.value = code === 'ECONNABORTED' || status === 408 || !status;
      permissionDenied.value = status === 401 || status === 403;
      if (!timeout.value && !permissionDenied.value) {
        error.value = (caught as { userMessage?: string }).userMessage ?? '讀取列表失敗';
      }
      const eventPayload = { page: page.value, status: status ?? 'unknown' };
      if (timeout.value) {
        trackEvent('restaurants_timeout', { ...eventPayload, resource: 'list' });
      } else if (permissionDenied.value) {
        trackEvent('restaurants_permission_denied', { ...eventPayload, resource: 'list' });
      } else {
        trackEvent('restaurants_list_failure', eventPayload);
      }
    } finally {
      loading.value = false;
    }
  };

  const goNext = async (): Promise<void> => {
    if (page.value < lastPage.value) {
      page.value += 1;
    }
  };

  const goPrev = async (): Promise<void> => {
    if (page.value > 1) {
      page.value -= 1;
    }
  };

  watch(
    () => page.value,
    () => {
      void load();
    },
    { immediate: true }
  );

  return {
    loading,
    error,
    empty,
    items,
    page,
    perPage,
    total,
    lastPage,
    load,
    goNext,
    goPrev,
    timeout,
    permissionDenied
  };
};
