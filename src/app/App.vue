<script setup lang="ts">
import { computed } from 'vue';
import { ConfigProvider as AConfigProvider } from 'ant-design-vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/layout/AppHeader.vue';
import { appThemeConfig } from '@/app/providers/AntdProvider';

const route = useRoute();
const showHeader = computed(() => route.name !== 'login');
</script>

<template>
  <AConfigProvider :theme="appThemeConfig">
    <AppHeader v-if="showHeader" />
    <RouterView />
  </AConfigProvider>
</template>
