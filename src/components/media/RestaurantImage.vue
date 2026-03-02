<script setup lang="ts">
import { computed, ref } from 'vue';
import { Image as AImage } from 'ant-design-vue';
import { getDefaultRestaurantAsset } from '@/services/restaurantAssets';
import { trackEvent } from '@/utils/telemetry';

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    loadMode?: 'lazy' | 'eager';
    height?: number;
  }>(),
  {
    loadMode: 'lazy',
    height: 180
  }
);

const loadError = ref(false);
const fallback = computed(() => getDefaultRestaurantAsset(props.loadMode));
const imageSrc = computed(() => (loadError.value ? fallback.value.imagePath : props.src));
const imageAlt = computed(() => (loadError.value ? fallback.value.altText : props.alt));

const onError = (): void => {
  if (!loadError.value) {
    loadError.value = true;
    trackEvent('restaurants_image_load_failure', { src: props.src });
    trackEvent('asset_fallback_shown', {
      assetKey: fallback.value.assetKey,
      reason: 'load-error',
      requestedSrc: props.src
    });
  }
};
</script>

<template>
  <AImage
    :src="imageSrc"
    :alt="imageAlt"
    :preview="false"
    :height="height"
    width="100%"
    :loading="loadMode"
    style="object-fit: cover"
    @error="onError"
  />
</template>
