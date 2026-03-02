<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageShell from '@/components/layout/PageShell.vue';
import ReservationForm from '@/components/reservations/ReservationForm.vue';
import RequestState from '@/components/state/RequestState.vue';
import { useAuthStore } from '@/stores/auth.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const rawRestaurantId = computed(() => route.query.restaurantId ?? null);

const restaurantId = computed(() => {
  const id = rawRestaurantId.value;
  if (!id) {
    return null;
  }
  const value = Array.isArray(id) ? id[0] : id;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
});

const restaurantName = computed(() => {
  const value = route.query.restaurantName;
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
});

const hasRestaurantContext = computed(() => restaurantId.value !== null);
const pageError = computed(() =>
  hasRestaurantContext.value ? null : '請先選擇餐廳'
);

const handleReauth = async (): Promise<void> => {
  await authStore.logout();
  await router.push({ name: 'login', query: { reason: 'unauthorized', redirect: route.fullPath } });
};

const goToRestaurants = async (): Promise<void> => {
  await router.push({ name: 'restaurants-list' });
};
</script>

<template>
  <PageShell title="快速訂位" layout="wide">
    <section class="reservation-flow">
      <RequestState
        :loading="false"
        :error="pageError"
        :empty="false"
        error-subtitle="請從餐廳詳情頁啟動訂位，或返回列表重新選擇餐廳。"
        retry-text="前往餐廳列表"
        @retry="goToRestaurants"
      >
        <ReservationForm
          :restaurant-id="restaurantId ?? ''"
          :restaurant-name="restaurantName"
          @reauth="handleReauth"
        />
      </RequestState>
    </section>
  </PageShell>
</template>

<style scoped>
.reservation-flow {
  max-width: 960px;
  margin: 0 auto;
}
</style>
