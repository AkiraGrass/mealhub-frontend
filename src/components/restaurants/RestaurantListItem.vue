<script setup lang="ts">
import { computed } from 'vue';
import { Button as AButton, Card as ACard, Typography as ATypography } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import type { RestaurantSummary } from '@/types/restaurant';
import RestaurantImage from '@/components/media/RestaurantImage.vue';
import { resolveRestaurantVisualAsset } from '@/services/restaurantAssets';
import IconLabelPair from '@/components/restaurants/info/IconLabelPair.vue';
import {
  defaultRestaurantInfoIcon,
  restaurantInfoIconMap,
  type RestaurantInfoField
} from '@/components/restaurants/info/icon-map';

const props = defineProps<{
  item: RestaurantSummary;
}>();
const router = useRouter();

const visualAsset = computed(() => resolveRestaurantVisualAsset(props.item.cuisineType, 'lazy'));
const detailRoute = computed(() => ({ name: 'restaurant-detail', params: { restaurantId: props.item.id } }));
const iconConfig = (field: RestaurantInfoField) => restaurantInfoIconMap[field] ?? defaultRestaurantInfoIcon;

const goToDetail = async (): Promise<void> => {
  await router.push(detailRoute.value);
};
</script>

<template>
  <ACard
    hoverable
    class="restaurant-card"
    :body-style="{ padding: 0 }"
    tabindex="0"
    :aria-label="`查看 ${item.name} 詳情`"
    @click="goToDetail"
    @keyup.enter="goToDetail"
    @keyup.space.prevent="goToDetail"
  >
    <div class="restaurant-card__media">
      <RestaurantImage
        :src="visualAsset.imagePath"
        :alt="visualAsset.altText"
        load-mode="lazy"
        :height="220"
      />
      <div class="restaurant-card__media-glow" />
    </div>
    <div class="restaurant-card__body">
      <ATypography.Title :level="5" class="restaurant-card__title">{{ item.name }}</ATypography.Title>
      <ATypography.Paragraph class="restaurant-card__description">
        {{ item.description || '無描述' }}
      </ATypography.Paragraph>
      <div class="restaurant-card__meta">
        <IconLabelPair :icon="iconConfig('address').icon" :label="iconConfig('address').label">
          <span class="restaurant-card__meta-value">{{ item.address }}</span>
        </IconLabelPair>
      </div>
      <AButton type="primary" block class="restaurant-card__cta" @click.stop="goToDetail">查看詳情</AButton>
    </div>
  </ACard>
</template>

<style scoped>
.restaurant-card {
  border: 1px solid rgba(212, 175, 55, 0.16);
  border-radius: var(--mh-radius-card);
  overflow: hidden;
  background: rgba(28, 33, 54, 0.9);
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.restaurant-card:focus-visible {
  outline: 2px solid rgba(212, 175, 55, 0.9);
  outline-offset: 2px;
}

.restaurant-card__media {
  position: relative;
}

.restaurant-card__media-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 18, 31, 0) 0%, rgba(12, 18, 31, 0.8) 100%);
  pointer-events: none;
}

.restaurant-card__body {
  padding: var(--mh-spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-sm);
  flex: 1;
}

.restaurant-card__title {
  margin-bottom: var(--mh-spacing-sm);
}

.restaurant-card__description {
  margin-bottom: var(--mh-spacing-sm);
  color: var(--mh-color-text-muted);
}

.restaurant-card__tags {
  margin-bottom: var(--mh-spacing-sm);
}

.restaurant-card__tag {
  background: rgba(212, 175, 55, 0.15);
  color: var(--mh-color-accent);
  border: none;
}

.restaurant-card__meta {
  margin-bottom: var(--mh-spacing-sm);
}

.restaurant-card__meta-value {
  font-size: 0.85rem;
  color: var(--mh-color-text-muted);
}

.restaurant-card__cta {
  margin-top: auto;
}

@media (max-width: 600px) {
  .restaurant-card__meta-value {
    display: block;
  }
}
</style>
