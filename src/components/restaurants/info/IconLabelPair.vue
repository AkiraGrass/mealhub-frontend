<script setup lang="ts">
import { Space as ASpace, Typography as ATypography } from 'ant-design-vue';
import type { RestaurantInfoLabel } from './icon-map';

const props = defineProps<{
  icon: unknown;
  label: RestaurantInfoLabel;
}>();
</script>

<template>
  <ASpace size="small" align="start" class="icon-label-pair">
    <component :is="props.icon" class="icon-label-pair__icon" aria-hidden="true" />
    <div class="icon-label-pair__text">
      <ATypography.Text class="icon-label-pair__label">
        {{ props.label.zhTW }}
        <span class="icon-label-pair__label--sub">/ {{ props.label.enUS }}</span>
      </ATypography.Text>
      <div v-if="$slots.default" class="icon-label-pair__value">
        <slot />
      </div>
    </div>
  </ASpace>
</template>

<style scoped>
.icon-label-pair__icon {
  font-size: 18px;
  color: var(--mh-color-accent);
}

.icon-label-pair__text {
  display: flex;
  flex-direction: column;
}

.icon-label-pair__label {
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
}

.icon-label-pair__label--sub {
  margin-left: 4px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
}

.icon-label-pair__value {
  color: var(--mh-color-text-muted, rgba(255, 255, 255, 0.65));
  font-size: 0.8rem;
  line-height: 1.4;
}
</style>
