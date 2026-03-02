<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  Alert as AAlert,
  Button as AButton,
  Drawer as ADrawer,
  Empty as AEmpty,
  Form as AForm,
  Input as AInput,
  InputNumber as AInputNumber,
  List as AList,
  Popconfirm as APopconfirm,
  Space as ASpace,
  Tag as ATag,
  Typography as ATypography,
  message as messageApi
} from 'ant-design-vue';
import type { TimeslotPayload } from '@/services/api/admin.api';
import type { AvailabilitySlot } from '@/types/reservation';

defineOptions({ name: 'TimeslotEditorDrawer' });

const props = defineProps<{
  open: boolean;
  slots: AvailabilitySlot[];
  saving?: boolean;
  disabled?: boolean;
  errorCode?: string | null;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'save', payload: TimeslotPayload & { slotId?: string }): void;
  (event: 'remove', slotId: string): void;
}>();

const message = messageApi;
const editingSlotId = ref<string | null>(null);
const formState = reactive({
  start: '',
  end: '',
  capacity: 2,
  notes: ''
});

const errorCopyMap: Record<string, string> = {
  cannotModifyTimeslotActive: '此時段已有進行中的預約，請先調整既有訂位後再修改。',
  cannotModifyTimeslotsActive: '目前仍有進行中的預約，請先處理衝突後再更新時段。',
  conflict: '時段設定與既有資料衝突，請調整時間後再試。'
};

const mutationErrorMessage = computed(() => {
  if (!props.errorCode) {
    return '';
  }
  return errorCopyMap[props.errorCode] ?? `操作失敗：${props.errorCode}`;
});

const isEditing = computed(() => Boolean(editingSlotId.value));

const formatDatetime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
};

const setFormFromSlot = (slot?: AvailabilitySlot): void => {
  if (!slot) {
    editingSlotId.value = null;
    formState.start = '';
    formState.end = '';
    formState.capacity = 2;
    formState.notes = '';
    return;
  }
  editingSlotId.value = slot.slotId;
  formState.start = slot.start;
  formState.end = slot.end;
  formState.capacity = Math.max(1, slot.capacity);
  formState.notes = slot.notes ?? '';
};

watch(
  () => props.open,
  (open: boolean) => {
    if (!open) {
      return;
    }
    setFormFromSlot(undefined);
  }
);

const validateForm = (): boolean => {
  if (!formState.start || !formState.end) {
    message.warning('請輸入開始與結束時間');
    return false;
  }
  const startTime = new Date(formState.start).getTime();
  const endTime = new Date(formState.end).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    message.warning('時間格式不正確，請使用可解析的日期時間格式');
    return false;
  }
  if (startTime >= endTime) {
    message.warning('結束時間必須晚於開始時間');
    return false;
  }
  if (formState.capacity <= 0) {
    message.warning('座位容量需大於 0');
    return false;
  }
  return true;
};

const handleSubmit = (): void => {
  if (props.disabled || props.saving) {
    return;
  }
  if (!validateForm()) {
    return;
  }
  emit('save', {
    slotId: editingSlotId.value ?? undefined,
    start: formState.start,
    end: formState.end,
    capacity: Number(formState.capacity),
    notes: formState.notes?.trim() || undefined
  });
};

const handleDelete = (slotId: string): void => {
  if (props.disabled || props.saving) {
    return;
  }
  emit('remove', slotId);
};

const handleCreateNew = (): void => {
  setFormFromSlot(undefined);
};
</script>

<template>
  <ADrawer
    :open="open"
    :title="isEditing ? '編輯時段' : '新增時段'"
    width="560"
    :destroy-on-close="false"
    class="timeslot-editor"
    @close="emit('close')"
  >
    <AAlert
      type="info"
      show-icon
      class="timeslot-editor__helper"
      message="提醒"
      description="若該時段已有 confirmed 訂位，系統會回傳 409 並阻擋更新。"
    />
    <AAlert
      v-if="mutationErrorMessage"
      type="warning"
      show-icon
      class="timeslot-editor__helper"
      :message="mutationErrorMessage"
    />

    <header class="timeslot-editor__header">
      <ATypography.Title :level="5">現有時段</ATypography.Title>
      <AButton type="primary" ghost size="small" :disabled="disabled || saving" @click="handleCreateNew">
        新增時段
      </AButton>
    </header>

    <AEmpty v-if="!slots.length" description="尚未設定時段" class="timeslot-editor__empty" />
    <AList v-else class="timeslot-editor__list" item-layout="horizontal" :data-source="slots">
      <template #renderItem="{ item }">
        <AList.Item>
          <template #actions>
            <AButton type="link" size="small" :disabled="disabled || saving" @click="setFormFromSlot(item)">
              編輯
            </AButton>
            <APopconfirm
              title="確定刪除此時段？"
              ok-text="刪除"
              cancel-text="取消"
              @confirm="handleDelete(item.slotId)"
            >
              <AButton danger type="link" size="small" :disabled="disabled || saving">刪除</AButton>
            </APopconfirm>
          </template>
          <AList.Item.Meta>
            <template #title>
              <span>{{ formatDatetime(item.start) }} - {{ formatDatetime(item.end) }}</span>
            </template>
            <template #description>
              <ASpace size="small" wrap>
                <ATag color="blue">容量 {{ item.capacity }}</ATag>
                <ATag color="gold">剩餘 {{ item.available }}</ATag>
                <ATag>已訂 {{ item.reserved }}</ATag>
              </ASpace>
            </template>
          </AList.Item.Meta>
        </AList.Item>
      </template>
    </AList>

    <AForm layout="vertical" class="timeslot-editor__form" @submit.prevent="handleSubmit">
      <AForm.Item label="開始時間">
        <AInput v-model:value="formState.start" placeholder="2026-03-01T18:00:00+08:00" />
      </AForm.Item>
      <AForm.Item label="結束時間">
        <AInput v-model:value="formState.end" placeholder="2026-03-01T19:30:00+08:00" />
      </AForm.Item>
      <AForm.Item label="座位容量">
        <AInputNumber v-model:value="formState.capacity" :min="1" :max="999" style="width: 100%" />
      </AForm.Item>
      <AForm.Item label="備註">
        <AInput.TextArea v-model:value="formState.notes" :rows="3" placeholder="例如：僅供包廂" />
      </AForm.Item>
      <AButton type="primary" block :loading="saving" :disabled="disabled" @click="handleSubmit">
        {{ isEditing ? '儲存變更' : '建立時段' }}
      </AButton>
    </AForm>
  </ADrawer>
</template>

<style scoped>
.timeslot-editor__helper {
  margin-bottom: var(--mh-spacing-sm);
}

.timeslot-editor__header {
  margin: var(--mh-spacing-sm) 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mh-spacing-sm);
}

.timeslot-editor__empty {
  margin-bottom: var(--mh-spacing-md);
}

.timeslot-editor__list {
  margin-bottom: var(--mh-spacing-md);
  border: 1px solid rgba(212, 175, 55, 0.18);
  border-radius: 12px;
  padding: 0 var(--mh-spacing-sm);
  background: rgba(15, 19, 30, 0.5);
}

.timeslot-editor__form {
  margin-top: var(--mh-spacing-md);
}
</style>
