<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import {
  Button as AButton,
  Drawer as ADrawer,
  Form as AForm,
  Input as AInput,
  InputNumber as AInputNumber,
  Space as ASpace,
  Tag as ATag,
  Typography as ATypography
} from 'ant-design-vue';
import type { Reservation } from '@/types/reservation';

const props = defineProps<{
  open: boolean;
  reservation: Reservation | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'save', payload: { slotId?: string; partySize?: number; notes?: string }): void;
  (event: 'cancel-reservation', reservation: Reservation): void;
}>();

const formState = reactive({
  slotId: '',
  partySize: 2,
  notes: ''
});

watch(
  () => props.reservation,
  (value) => {
    if (value) {
      formState.slotId = value.slotId ?? '';
      formState.partySize = value.partySize;
      formState.notes = value.notes ?? '';
    } else {
      formState.slotId = '';
      formState.partySize = 2;
      formState.notes = '';
    }
  },
  { immediate: true }
);

const handleSave = (): void => {
  emit('save', {
    slotId: formState.slotId || undefined,
    partySize: formState.partySize,
    notes: formState.notes || undefined
  });
};

const handleCancelReservation = (): void => {
  if (props.reservation) {
    emit('cancel-reservation', props.reservation);
  }
};

const handleClose = (): void => {
  emit('close');
};

const isCancelled = computed(() => props.reservation?.status === 'cancelled');
</script>

<template>
  <ADrawer
    :open="open"
    width="420"
    title="管理訂位"
    :destroy-on-close="true"
    class="reservation-actions-drawer"
    @close="handleClose"
  >
    <template v-if="reservation">
      <section class="drawer-section">
        <ATypography.Title :level="5">訂位資訊</ATypography.Title>
        <div class="drawer-section__meta">
          <ATag color="gold">{{ reservation.code }}</ATag>
          <ATag>{{ reservation.status }}</ATag>
        </div>
        <ATypography.Paragraph type="secondary">
          日期：{{ reservation.date }} · 時段：{{ reservation.start }} - {{ reservation.end }}
        </ATypography.Paragraph>
        <ATypography.Paragraph type="secondary">
          人數：{{ reservation.partySize }} 位 · 餐廳：{{ reservation.restaurantId }}
        </ATypography.Paragraph>
      </section>

      <AForm layout="vertical" class="drawer-form">
        <AForm.Item label="時段 ID (slotId)">
          <AInput v-model:value="formState.slotId" placeholder="slot-123" :disabled="isCancelled || loading" />
        </AForm.Item>
        <AForm.Item label="人數">
          <AInputNumber
            v-model:value="formState.partySize"
            :min="1"
            style="width: 100%"
            :disabled="isCancelled || loading"
          />
        </AForm.Item>
        <AForm.Item label="備註">
          <AInput.TextArea
            v-model:value="formState.notes"
            :rows="3"
            placeholder="可選填"
            :disabled="isCancelled || loading"
          />
        </AForm.Item>
      </AForm>

      <ATypography.Paragraph v-if="isCancelled" type="warning">
        此訂位已取消，無法再修改。若需要時段請重新建立新訂位。
      </ATypography.Paragraph>

      <ASpace class="drawer-actions" align="center">
        <AButton type="primary" :loading="loading" :disabled="isCancelled" @click="handleSave">
          儲存修改
        </AButton>
        <AButton
          danger
          ghost
          :loading="loading"
          :disabled="isCancelled"
          @click="handleCancelReservation"
        >
          {{ isCancelled ? '已取消訂位' : '取消訂位' }}
        </AButton>
      </ASpace>
    </template>
    <template v-else>
      <ATypography.Paragraph>請從列表選擇要管理的訂位。</ATypography.Paragraph>
    </template>
  </ADrawer>
</template>

<style scoped>
.drawer-section {
  margin-bottom: var(--mh-spacing-lg);
}

.drawer-section__meta {
  display: flex;
  gap: var(--mh-spacing-sm);
  margin-bottom: var(--mh-spacing-sm);
}

.drawer-form {
  margin-bottom: var(--mh-spacing-md);
}

.drawer-actions {
  justify-content: flex-end;
  width: 100%;
}
</style>
