<script setup lang="ts">
import RequestState from '@/components/state/RequestState.vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const handleRetry = (): void => {
  const redirect = (route.query.from as string | undefined) ?? '/';
  void router.push(redirect);
};

const handleReauth = (): void => {
  void router.push({ name: 'login', query: { redirect: route.query.from } });
};
</script>

<template>
  <div class="permission-page">
    <RequestState
      :loading="false"
      :error="null"
      :empty="false"
      :permission-denied="true"
      @retry="handleRetry"
      @reauth="handleReauth"
    />
  </div>
</template>

<style scoped>
.permission-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
</style>
