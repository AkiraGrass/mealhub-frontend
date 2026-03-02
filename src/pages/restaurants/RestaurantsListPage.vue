<script setup lang="ts">
import { computed } from 'vue';
import { Row as ARow, Col as ACol, Typography as ATypography } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import PageShell from '@/components/layout/PageShell.vue';
import RequestState from '@/components/state/RequestState.vue';
import RestaurantListItem from '@/components/restaurants/RestaurantListItem.vue';
import RestaurantsPagination from '@/components/restaurants/RestaurantsPagination.vue';
import { useRestaurantsList } from '@/composables/useRestaurantsList';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();
const { loading, error, empty, items, page, lastPage, load, goNext, goPrev, timeout, permissionDenied } =
  useRestaurantsList();

const rowJustify = computed(() => (items.value.length <= 1 ? 'center' : 'start'));

const handleReauth = async (): Promise<void> => {
  await authStore.logout();
  await router.push({ name: 'login', query: { reason: 'unauthorized' } });
};
</script>

<template>
  <PageShell title="餐廳列表" layout="wide">
    <ATypography.Paragraph class="restaurants-page__subtitle">
      精選餐廳以一致的深色 + 金色主題呈現，所有卡片皆支援快速預覽與一鍵預約。
    </ATypography.Paragraph>
    <RequestState
      :loading="loading"
      :error="error"
      :empty="empty"
      :timeout="timeout"
      :permission-denied="permissionDenied"
      @retry="load"
      @reauth="handleReauth"
    >
      <ARow :gutter="[24, 24]" :justify="rowJustify" class="restaurants-grid">
        <ACol v-for="item in items" :key="item.id" :xs="24" :md="12" :xl="8">
          <RestaurantListItem :item="item" />
        </ACol>
      </ARow>
      <div style="margin-top: 16px; display: flex; justify-content: center">
        <RestaurantsPagination :page="page" :last-page="lastPage" @prev="goPrev" @next="goNext" />
      </div>
    </RequestState>
  </PageShell>
</template>

<style scoped>
.restaurants-page__subtitle {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: var(--mh-spacing-lg);
}

.restaurants-grid {
  min-height: 280px;
}

@media (max-width: 768px) {
  .restaurants-page__subtitle {
    font-size: 0.95rem;
  }
}
</style>
