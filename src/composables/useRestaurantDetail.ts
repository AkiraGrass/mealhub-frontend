import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchRestaurantDetailApi } from '@/services/api/restaurants.api';
import type { RestaurantDetail } from '@/types/restaurant';
import { trackEvent } from '@/utils/telemetry';

export const useRestaurantDetail = () => {
  const route = useRoute();
  const router = useRouter();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const detail = ref<RestaurantDetail | null>(null);
  const timeout = ref(false);
  const permissionDenied = ref(false);

  const restaurantId = computed(() => Number(route.params.restaurantId));

  const load = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    timeout.value = false;
    permissionDenied.value = false;
    try {
      detail.value = await fetchRestaurantDetailApi(restaurantId.value);
      trackEvent('restaurants_detail_success', { restaurantId: restaurantId.value });
    } catch (caught) {
      detail.value = null;
      const status = (caught as { response?: { status?: number } }).response?.status;
      const code = (caught as { code?: string }).code;
      timeout.value = code === 'ECONNABORTED' || status === 408 || !status;
      permissionDenied.value = status === 401 || status === 403;
      if (!timeout.value && !permissionDenied.value) {
        error.value = (caught as { userMessage?: string }).userMessage ?? '讀取詳情失敗';
      }
      const payload = { restaurantId: restaurantId.value, status: status ?? 'unknown' };
      if (timeout.value) {
        trackEvent('restaurants_timeout', { ...payload, resource: 'detail' });
      } else if (permissionDenied.value) {
        trackEvent('restaurants_permission_denied', { ...payload, resource: 'detail' });
      } else {
        trackEvent('restaurants_detail_failure', payload);
      }
    } finally {
      loading.value = false;
    }
  };

  const backToList = async (): Promise<void> => {
    await router.push({ name: 'restaurants-list' });
  };

  watch(
    () => restaurantId.value,
    () => {
      void load();
    },
    { immediate: true }
  );

  return {
    loading,
    error,
    detail,
    load,
    backToList,
    timeout,
    permissionDenied
  };
};
