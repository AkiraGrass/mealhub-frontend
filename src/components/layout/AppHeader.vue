<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Button as AButton, Layout as ALayout, Space as ASpace, Typography as ATypography } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const LAST_RESTAURANT_CONTEXT_KEY = 'mh:lastRestaurantContext';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const lastRestaurantId = ref<string | null>(null);

if (typeof window !== 'undefined') {
  lastRestaurantId.value = window.localStorage.getItem(LAST_RESTAURANT_CONTEXT_KEY);
}

const currentRestaurantId = computed(() => {
  const param = route.params.restaurantId ?? route.query.restaurantId;
  if (Array.isArray(param)) {
    return param[0] ? String(param[0]) : null;
  }
  return param ? String(param) : null;
});

watch(
  () => currentRestaurantId.value,
  (value) => {
    if (!value) {
      return;
    }
    lastRestaurantId.value = value;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_RESTAURANT_CONTEXT_KEY, value);
    }
  },
  { immediate: true }
);

const adminRoute = computed(() => {
  const restaurantId = currentRestaurantId.value ?? lastRestaurantId.value;
  if (!restaurantId) {
    return null;
  }
  return { name: 'admin-dashboard' as const, params: { restaurantId } };
});

const handleLogout = async (): Promise<void> => {
  await authStore.logout();
  await router.push({ name: 'login' });
};
</script>

<template>
  <ALayout.Header class="app-header">
    <div class="app-header__content">
      <RouterLink :to="{ name: 'restaurants-list' }" class="app-header__brand" aria-label="回到首頁">
        <ATypography.Title :level="4" class="app-header__title">MealHub</ATypography.Title>
      </RouterLink>
      <nav class="app-header__nav">
        <RouterLink
          v-if="authStore.isAuthenticated"
          :to="{ name: 'my-reservations' }"
          class="app-header__link"
        >
          我的訂位
        </RouterLink>
        <RouterLink :to="{ name: 'reservation-code-lookup' }" class="app-header__link">
          訂位碼查詢
        </RouterLink>
        <RouterLink
          v-if="authStore.isAuthenticated && adminRoute"
          :to="adminRoute"
          class="app-header__link"
        >
          餐廳後台
        </RouterLink>
      </nav>
      <ASpace>
        <AButton v-if="authStore.isAuthenticated" type="primary" aria-label="登出" @click="handleLogout">
          登出
        </AButton>
      </ASpace>
    </div>
  </ALayout.Header>
</template>

<style scoped>
.app-header__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mh-spacing-lg);
}

.app-header__nav {
  display: flex;
  gap: var(--mh-spacing-md);
}

.app-header__brand {
  display: inline-flex;
  text-decoration: none;
}

.app-header__link {
  color: rgba(255, 255, 255, 0.85);
}

.app-header__link.router-link-active {
  color: var(--mh-color-accent, #d4af37);
}
</style>
