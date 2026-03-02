<script setup lang="ts">
import { computed } from 'vue';
import {
  Button as AButton,
  Card as ACard,
  Descriptions as ADescriptions,
  Space as ASpace,
  Tabs as ATabs,
  Typography as ATypography
} from 'ant-design-vue';
import PageShell from '@/components/layout/PageShell.vue';
import RestaurantImage from '@/components/media/RestaurantImage.vue';
import RequestState from '@/components/state/RequestState.vue';
import ReservationForm from '@/components/reservations/ReservationForm.vue';
import { useRestaurantDetail } from '@/composables/useRestaurantDetail';
import {
  defaultRestaurantInfoIcon,
  restaurantInfoIconMap,
  type RestaurantInfoField
} from '@/components/restaurants/info/icon-map';
import { resolveRestaurantVisualAsset } from '@/services/restaurantAssets';
import IconLabelPair from '@/components/restaurants/info/IconLabelPair.vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();
const { loading, error, detail, load, backToList, timeout, permissionDenied } = useRestaurantDetail();
const empty = computed(() => !loading.value && !error.value && !detail.value);

const detailVisual = computed(() => {
  if (!detail.value) {
    return resolveRestaurantVisualAsset('default', 'eager');
  }
  return resolveRestaurantVisualAsset(detail.value.cuisineType, 'eager');
});

const iconConfig = (field: RestaurantInfoField) => restaurantInfoIconMap[field] ?? defaultRestaurantInfoIcon;

const timeslotText = computed(() => {
  if (!detail.value?.timeslots?.length) {
    return '無時段資訊';
  }
  return detail.value.timeslots.map((slot) => `${slot.start}-${slot.end}`).join('、');
});

const handleReauth = async (): Promise<void> => {
  await authStore.logout();
  await router.push({ name: 'login', query: { reason: 'unauthorized' } });
};

const handleOpenAdminDashboard = async (): Promise<void> => {
  if (!detail.value?.id) {
    return;
  }
  await router.push({
    name: 'admin-dashboard',
    params: { restaurantId: String(detail.value.id) }
  });
};
</script>

<template>
  <PageShell title="餐廳詳情">
    <RequestState
      :loading="loading"
      :error="error"
      :empty="empty"
      :timeout="timeout"
      :permission-denied="permissionDenied"
      @retry="load"
      @reauth="handleReauth"
    >
      <div v-if="detail" class="detail-layout">
        <div class="detail-layout__main">
          <ACard class="detail-card" :body-style="{ padding: 0 }">
            <RestaurantImage
              :src="detailVisual.imagePath"
              :alt="detailVisual.altText"
              load-mode="eager"
              :height="360"
            />
            <div class="detail-card__body">
              <div class="detail-card__heading">
                <ATypography.Title :level="2" class="detail-card__title">{{ detail.name }}</ATypography.Title>
              </div>
              <ATypography.Paragraph class="detail-card__description">
                {{ detail.description || '無描述' }}
              </ATypography.Paragraph>
              <div class="gold-divider" />
              <ATabs class="detail-card__tabs" default-active-key="info">
                <ATabs.TabPane key="info" tab="餐廳資訊">
                  <ADescriptions :column="1" colon="false" class="detail-card__descriptions">
                    <ADescriptions.Item>
                      <template #label>
                        <IconLabelPair :icon="iconConfig('address').icon" :label="iconConfig('address').label" />
                      </template>
                      <ATypography.Text>{{ detail.address }}</ATypography.Text>
                    </ADescriptions.Item>
                    <ADescriptions.Item>
                      <template #label>
                        <IconLabelPair :icon="iconConfig('timeslots').icon" :label="iconConfig('timeslots').label" />
                      </template>
                      <ATypography.Text>{{ timeslotText }}</ATypography.Text>
                    </ADescriptions.Item>
                  </ADescriptions>
                </ATabs.TabPane>
                <ATabs.TabPane key="note" tab="預約須知">
                  <ATypography.Paragraph class="detail-note">
                    {{ detail.note || '目前沒有額外備註，直接選擇適合的時段即可完成訂位。' }}
                  </ATypography.Paragraph>
                  <ATypography.Paragraph v-if="detail.timeslots?.length" class="detail-note">
                    <strong>可預約時段</strong>：{{ timeslotText }}
                  </ATypography.Paragraph>
                </ATabs.TabPane>
              </ATabs>
            </div>
          </ACard>
          <ASpace class="detail-card__actions">
            <AButton type="default" ghost class="detail-card__back" @click="backToList">返回列表</AButton>
            <AButton type="primary" ghost class="detail-card__admin" @click="handleOpenAdminDashboard">
              餐廳後台
            </AButton>
          </ASpace>
        </div>
        <div class="detail-layout__booking">
          <ReservationForm
            :restaurant-id="detail.id"
            :restaurant-name="detail.name"
            @reauth="handleReauth"
          />
        </div>
      </div>
    </RequestState>
  </PageShell>
</template>

<style scoped>
.detail-layout {
  display: grid;
  gap: var(--mh-spacing-xl);
  grid-template-columns: minmax(0, 3fr) minmax(320px, 2fr);
  align-items: flex-start;
}

.detail-layout__booking {
  align-self: flex-start;
  width: 100%;
}

.detail-layout__booking :deep(.reservation-form) {
  width: 100%;
}

.detail-card {
  background: var(--mh-color-surface);
  border: 1px solid var(--mh-color-border);
}

.detail-card__body {
  padding: var(--mh-spacing-xl);
  background: linear-gradient(180deg, rgba(12, 17, 32, 0.85), rgba(9, 12, 22, 0.7));
  color: var(--mh-color-text-primary);
}

.detail-card__title {
  margin-bottom: var(--mh-spacing-sm);
}

.detail-card__description {
  margin-bottom: var(--mh-spacing-md);
  color: var(--mh-color-text-muted);
}

.detail-card__tag {
  background: rgba(212, 175, 55, 0.15);
  color: var(--mh-color-accent);
  border: none;
}

.detail-card__tabs :deep(.ant-tabs-nav) {
  margin-bottom: var(--mh-spacing-md);
}

.detail-card__descriptions :deep(.ant-descriptions-item-label) {
  color: rgba(255, 255, 255, 0.8);
}

.detail-card__descriptions :deep(.ant-descriptions-item-content) {
  color: rgba(255, 255, 255, 0.9);
}

.detail-note {
  color: rgba(255, 255, 255, 0.82);
}

.detail-card__back {
  margin-top: var(--mh-spacing-md);
}

.detail-card__actions {
  margin-top: var(--mh-spacing-md);
}

@media (max-width: 992px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-layout__booking {
    order: -1;
  }
}
</style>
