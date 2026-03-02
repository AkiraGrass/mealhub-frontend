<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Alert as AAlert,
  Button as AButton,
  Card as ACard,
  Empty as AEmpty,
  InputNumber as AInputNumber,
  Popconfirm as APopconfirm,
  Space as ASpace,
  Typography as ATypography,
  message as messageApi
} from 'ant-design-vue';
import type { TableBucket } from '@/types/reservation';

interface EditableBucket extends TableBucket {
  key: string;
}

defineOptions({ name: 'TableBucketEditor' });

const props = defineProps<{
  buckets: TableBucket[];
  disabled?: boolean;
  saving?: boolean;
  errorCode?: string | null;
}>();

const emit = defineEmits<{
  (event: 'save', buckets: TableBucket[]): void;
}>();

const message = messageApi;
const rows = ref<EditableBucket[]>([]);

const errorCopyMap: Record<string, string> = {
  cannotModifyTimeslotActive: '有時段正在使用，無法調整座位 bucket。',
  cannotModifyTimeslotsActive: '目前存在進行中的預約，請先排除衝突後再更新。',
  conflict: '座位設定衝突，請檢查 bucket 後重新送出。'
};

const mutationErrorMessage = computed(() => {
  if (!props.errorCode) {
    return '';
  }
  return errorCopyMap[props.errorCode] ?? `操作失敗：${props.errorCode}`;
});

watch(
  () => props.buckets,
  (buckets: TableBucket[]) => {
    rows.value = buckets.map((bucket: TableBucket) => ({
      ...bucket,
      key: bucket.bucketId
    }));
  },
  { immediate: true, deep: true }
);

const buildDraftBucket = (): EditableBucket => {
  const nextId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    key: nextId,
    bucketId: nextId,
    size: 2,
    capacity: 1,
    reserved: 0,
    available: 1
  };
};

const addBucket = (): void => {
  if (props.disabled || props.saving) {
    return;
  }
  rows.value = [...rows.value, buildDraftBucket()];
};

const removeBucket = (key: string): void => {
  if (props.disabled || props.saving) {
    return;
  }
  rows.value = rows.value.filter((row) => row.key !== key);
};

const updateCapacity = (row: EditableBucket): void => {
  row.available = Math.max(Number(row.capacity) - Number(row.reserved), 0);
};

const validateRows = (): boolean => {
  if (!rows.value.length) {
    message.warning('至少要保留一個 bucket');
    return false;
  }
  const sizeSet = new Set<number>();
  for (const row of rows.value) {
    if (row.size <= 0 || row.capacity <= 0) {
      message.warning('bucket 的人數與桌數都必須大於 0');
      return false;
    }
    if (sizeSet.has(row.size)) {
      message.warning('每個 bucket 人數需唯一，請避免重複');
      return false;
    }
    sizeSet.add(row.size);
  }
  return true;
};

const handleSubmit = (): void => {
  if (props.disabled || props.saving) {
    return;
  }
  if (!validateRows()) {
    return;
  }
  emit(
    'save',
    rows.value.map((row) => ({
      bucketId: row.bucketId,
      size: Number(row.size),
      capacity: Number(row.capacity),
      reserved: Number(row.reserved),
      available: Math.max(Number(row.capacity) - Number(row.reserved), 0)
    }))
  );
};
</script>

<template>
  <ACard class="table-bucket-editor" :bordered="false">
    <header class="table-bucket-editor__header">
      <div>
        <ATypography.Title :level="5">座位 Bucket</ATypography.Title>
        <ATypography.Paragraph type="secondary" class="table-bucket-editor__copy">
          依人數區間設定可用桌數。若與既有 confirmed 訂位衝突，API 會回傳 409。
        </ATypography.Paragraph>
      </div>
      <AButton type="primary" ghost :disabled="disabled || saving" @click="addBucket">新增 bucket</AButton>
    </header>

    <AAlert
      v-if="mutationErrorMessage"
      type="warning"
      show-icon
      class="table-bucket-editor__alert"
      :message="mutationErrorMessage"
    />

    <AEmpty v-if="!rows.length" description="尚未建立 bucket" class="table-bucket-editor__empty" />

    <div v-else class="table-bucket-editor__rows">
      <div v-for="row in rows" :key="row.key" class="table-bucket-row">
        <AInputNumber
          v-model:value="row.size"
          :min="1"
          :max="20"
          :disabled="disabled || saving"
          addon-before="人數"
          class="table-bucket-row__field"
        />
        <AInputNumber
          v-model:value="row.capacity"
          :min="1"
          :max="200"
          :disabled="disabled || saving"
          addon-before="桌數"
          class="table-bucket-row__field"
          @change="updateCapacity(row)"
        />
        <ATypography.Text type="secondary" class="table-bucket-row__summary">
          已訂 {{ row.reserved }} / 剩餘 {{ Math.max(row.capacity - row.reserved, 0) }}
        </ATypography.Text>
        <APopconfirm
          title="確定刪除此 bucket？"
          ok-text="刪除"
          cancel-text="取消"
          @confirm="removeBucket(row.key)"
        >
          <AButton danger type="text" :disabled="disabled || saving">移除</AButton>
        </APopconfirm>
      </div>
    </div>

    <ASpace class="table-bucket-editor__actions">
      <AButton type="primary" :loading="saving" :disabled="disabled" @click="handleSubmit">
        儲存 bucket 設定
      </AButton>
    </ASpace>
  </ACard>
</template>

<style scoped>
.table-bucket-editor {
  background: rgba(15, 19, 30, 0.72);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.table-bucket-editor__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mh-spacing-sm);
}

.table-bucket-editor__copy {
  margin-bottom: 0;
}

.table-bucket-editor__alert {
  margin-top: var(--mh-spacing-sm);
}

.table-bucket-editor__rows {
  margin-top: var(--mh-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-sm);
}

.table-bucket-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--mh-spacing-sm);
  padding: var(--mh-spacing-sm);
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  background: rgba(9, 12, 22, 0.45);
}

.table-bucket-row__field {
  width: 100%;
}

.table-bucket-row__summary {
  white-space: nowrap;
}

.table-bucket-editor__actions {
  margin-top: var(--mh-spacing-md);
}

@media (max-width: 900px) {
  .table-bucket-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .table-bucket-row__summary {
    grid-column: 1 / -1;
  }
}
</style>
