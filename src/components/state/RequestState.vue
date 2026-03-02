<script setup lang="ts">
import { Button as AButton, Empty as AEmpty, Result as AResult, Skeleton as ASkeleton } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    loading: boolean;
    error: string | null;
    empty: boolean;
    timeout?: boolean;
    permissionDenied?: boolean;
    emptyDescription?: string;
    timeoutTitle?: string;
    timeoutSubtitle?: string;
    permissionTitle?: string;
    permissionSubtitle?: string;
    errorSubtitle?: string;
    retryText?: string;
    backText?: string;
    reauthText?: string;
  }>(),
  {
    timeout: false,
    permissionDenied: false,
    emptyDescription: '目前沒有資料',
    timeoutTitle: '連線逾時',
    timeoutSubtitle: '網路較慢或伺服器忙碌，請再試一次',
    permissionTitle: '需要重新登入',
    permissionSubtitle: '您的登入狀態已失效，請重新登入以繼續',
    errorSubtitle: '請稍後重試或返回上一頁',
    retryText: '重試',
    backText: '返回',
    reauthText: '重新登入'
  }
);

const emit = defineEmits<{
  (event: 'retry'): void;
  (event: 'reauth'): void;
}>();
</script>

<template>
  <div class="request-state">
    <ASkeleton v-if="props.loading" active :paragraph="{ rows: 4 }" />
    <AResult
      v-else-if="props.permissionDenied"
      status="403"
      :title="props.permissionTitle"
      :sub-title="props.permissionSubtitle"
      class="request-state__result"
    >
      <template #extra>
        <AButton type="primary" @click="emit('reauth')">{{ props.reauthText }}</AButton>
        <AButton ghost @click="emit('retry')">{{ props.backText }}</AButton>
      </template>
    </AResult>
    <AResult
      v-else-if="props.timeout"
      status="warning"
      :title="props.timeoutTitle"
      :sub-title="props.timeoutSubtitle"
      class="request-state__result"
    >
      <template #extra>
        <AButton type="primary" @click="emit('retry')">{{ props.retryText }}</AButton>
      </template>
    </AResult>
    <AResult
      v-else-if="props.error"
      status="error"
      :title="props.error"
      :sub-title="props.errorSubtitle"
      class="request-state__result"
    >
      <template #extra>
        <AButton type="primary" @click="emit('retry')">{{ props.retryText }}</AButton>
      </template>
    </AResult>
    <AEmpty v-else-if="props.empty" :description="props.emptyDescription" class="request-state__empty" />
    <slot v-else />
  </div>
</template>

<style scoped>
.request-state {
  width: 100%;
}

.request-state__result :deep(.ant-result-title) {
  color: var(--mh-color-text-primary, #fff);
}

.request-state__result :deep(.ant-result-subtitle) {
  color: var(--mh-color-text-muted, rgba(255, 255, 255, 0.72));
}

.request-state__empty :deep(.ant-empty-description) {
  color: var(--mh-color-text-muted, rgba(255, 255, 255, 0.72));
}
</style>
