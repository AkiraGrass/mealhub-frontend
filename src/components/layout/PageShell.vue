<script setup lang="ts">
import { computed } from 'vue';
import { Layout as ALayout } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    layout?: 'default' | 'wide';
    compact?: boolean;
  }>(),
  {
    title: '',
    layout: 'default',
    compact: false
  }
);

const shellClass = computed(() => ({
  'page-shell': true,
  'page-shell--wide': props.layout === 'wide'
}));

const cardClass = computed(() => ({
  'page-shell__card': true,
  'page-shell__card--compact': props.compact
}));
</script>

<template>
  <ALayout :class="shellClass">
    <ALayout.Content :class="cardClass">
      <header v-if="title">
        <h2 class="page-title">{{ title }}</h2>
        <div class="gold-divider" />
      </header>
      <slot />
    </ALayout.Content>
  </ALayout>
</template>
