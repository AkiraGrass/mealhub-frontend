<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import {
  Alert as AAlert,
  Button as AButton,
  Form as AForm,
  type FormInstance,
  Input as AInput,
  InputNumber as AInputNumber,
  Result as AResult,
  Space as ASpace,
  Steps as ASteps,
  Tag as ATag,
  Typography as ATypography
} from 'ant-design-vue';
import { useRouter } from 'vue-router';
import RequestState from '@/components/state/RequestState.vue';
import AvailabilityGrid from '@/components/reservations/AvailabilityGrid.vue';
import { useReservations } from '@/composables/useReservations';
import type { Reservation, ReservationBusinessError } from '@/types/reservation';

defineOptions({ name: 'ReservationForm' });

const props = defineProps<{
  restaurantId: number | string;
  restaurantName?: string;
  initialDate?: string;
}>();

const emit = defineEmits<{
  (event: 'completed', reservation: Reservation): void;
  (event: 'reauth'): void;
}>();

const today = (): string => new Date().toISOString().slice(0, 10);

const router = useRouter();
const {
  availability,
  formState,
  selectedSlot,
  isLoadingAvailability,
  errorMessage,
  canSubmit,
  availabilityTimeout,
  availabilityPermissionDenied,
  loadAvailability,
  createReservation,
  selectSlot,
  resetFormState
} = useReservations();

const selectedDate = ref(props.initialDate ?? formState.value.selectedDate ?? today());
const partySize = ref(formState.value.partySize ?? 2);
const currentStep = ref(0);
const hasLookupAttempt = ref(false);
const submitting = computed(() => formState.value.isSubmitting);
const contactFormRef = ref<FormInstance>();
const contact = reactive({ name: '', phone: '', email: '', notes: '' });
const successReservation = ref<Reservation | null>(null);

const businessErrorCopy: Record<ReservationBusinessError, { title: string; description: string }> = {
  sold_out: {
    title: '本時段已滿位',
    description: '此時段已無空位，您可以選擇其他時段或人數。'
  },
  already_reserved_this_restaurant: {
    title: '您已經預約此餐廳',
    description: '系統偵測到相同帳號已有此餐廳訂位，請調整或取消原訂位。'
  },
  no_capacity_for_party_size: {
    title: '超過可容納人數',
    description: '目前沒有足夠座位容納此人數，請調整人數或選擇其他時段。'
  },
  cannotModifyTimeslotActive: {
    title: '目前時段不可修改',
    description: '該時段有進行中的訂位，請選擇其他時段或稍後再試。'
  },
  cannotModifyTimeslotsActive: {
    title: '目前時段不可修改',
    description: '該時段有進行中的訂位，請選擇其他時段或稍後再試。'
  }
};

const businessError = computed(() =>
  formState.value.businessError ? businessErrorCopy[formState.value.businessError] : null
);

const alternateSlots = computed(() =>
  availability.value.filter(
    (slot) => slot.available > 0 && slot.slotId !== formState.value.selectedSlotId
  )
);

const availabilityEmpty = computed(
  () =>
    hasLookupAttempt.value &&
    !isLoadingAvailability.value &&
    !errorMessage.value &&
    !availabilityTimeout.value &&
    !availabilityPermissionDenied.value &&
    availability.value.length === 0
);

const isSuccessVisible = computed(() => Boolean(successReservation.value));
const selectedSlotSummary = computed(() => {
  if (!selectedSlot.value) {
    return '';
  }
  return `${selectedSlot.value.start} - ${selectedSlot.value.end}`;
});

const contactRules = {
  name: [{ required: true, message: '請輸入聯絡人姓名' }],
  phone: [{ required: true, message: '請輸入聯絡電話' }],
  email: [
    { required: true, message: '請輸入聯絡 Email' },
    { type: 'email', message: 'Email 格式不正確' }
  ]
};

const handleLookup = async (): Promise<void> => {
  if (!props.restaurantId) {
    return;
  }
  hasLookupAttempt.value = true;
  successReservation.value = null;
  const normalizedPartySize = Math.max(1, Number(partySize.value) || 1);
  partySize.value = normalizedPartySize;
  currentStep.value = 1;
  try {
    await loadAvailability({
      restaurantId: props.restaurantId,
      date: selectedDate.value,
      partySize: normalizedPartySize
    });
  } catch {
    // handled via request state
  }
};

const handleSlotSelect = (slotId: string): void => {
  selectSlot(slotId);
};

const goToStep = (step: number): void => {
  currentStep.value = step;
};

const handleSubmit = async (): Promise<void> => {
  if (!formState.value.selectedSlotId) {
    return;
  }
  try {
    await contactFormRef.value?.validate();
  } catch {
    return;
  }

  successReservation.value = null;
  try {
    const reservation = await createReservation({
      restaurantId: props.restaurantId,
      slotId: formState.value.selectedSlotId,
      date: selectedDate.value,
      partySize: partySize.value,
      contact: {
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim()
      },
      notes: contact.notes?.trim() || undefined
    });
    successReservation.value = reservation;
    emit('completed', reservation);
  } catch {
    // error handled by store
  }
};

const clearContact = (): void => {
  contact.name = '';
  contact.phone = '';
  contact.email = '';
  contact.notes = '';
};

const resetFlow = (): void => {
  resetFormState();
  selectSlot();
  currentStep.value = 0;
  hasLookupAttempt.value = false;
  successReservation.value = null;
  clearContact();
  selectedDate.value = props.initialDate ?? today();
  partySize.value = 2;
};

const handleReauth = (): void => {
  emit('reauth');
};

const handleAlternateSelect = (slotId: string): void => {
  handleSlotSelect(slotId);
  currentStep.value = 1;
};

const handleStartOver = (): void => {
  resetFlow();
};

const handleViewRestaurant = async (): Promise<void> => {
  if (props.restaurantId) {
    await router.push({ name: 'restaurant-detail', params: { restaurantId: props.restaurantId } });
    return;
  }
  await router.push({ name: 'restaurants-list' });
};

watch(
  () => props.restaurantId,
  (_next, prev) => {
    if (prev !== undefined) {
      resetFlow();
    }
  }
);

onBeforeUnmount(() => {
  resetFlow();
});
</script>

<template>
  <section class="reservation-form">
    <ATypography.Title :level="4" class="reservation-form__title">
      {{ restaurantName ? `預約 ${restaurantName}` : '預約餐廳' }}
    </ATypography.Title>
    <ASteps
      :current="currentStep"
      size="small"
      label-placement="vertical"
      :responsive="true"
      class="reservation-form__steps"
      @change="goToStep"
    >
      <ASteps.Step title="日期與人數" />
      <ASteps.Step title="選擇時段" />
      <ASteps.Step title="確認資料" />
    </ASteps>

    <section v-if="currentStep === 0" class="reservation-form__section">
      <AForm layout="vertical" @submit.prevent="handleLookup">
        <AForm.Item label="日期" name="date">
          <AInput
            id="reservation-date"
            v-model:value="selectedDate"
            type="date"
            name="reservation-date"
            :min="today()"
            required
          />
        </AForm.Item>
        <AForm.Item label="人數" name="partySize">
          <AInputNumber
            v-model:value="partySize"
            :min="1"
            :max="20"
            name="party-size"
            style="width: 100%"
          />
        </AForm.Item>
        <AButton
          type="primary"
          html-type="submit"
          block
          class="reservation-form__action reservation-form__action--primary"
        >
          查看可用時段
        </AButton>
      </AForm>
    </section>

    <section v-else-if="currentStep === 1" class="reservation-form__section">
      <RequestState
        v-if="hasLookupAttempt"
        :loading="isLoadingAvailability"
        :error="errorMessage"
        :empty="availabilityEmpty"
        :timeout="availabilityTimeout"
        :permission-denied="availabilityPermissionDenied"
        @retry="handleLookup"
        @reauth="handleReauth"
      >
        <AvailabilityGrid
          :slots="availability"
          :selected-slot-id="formState.selectedSlotId"
          @select="handleSlotSelect"
        />
      </RequestState>
      <div v-else class="reservation-form__placeholder">請先輸入日期與人數以載入可預約時段。</div>
      <ASpace class="reservation-form__actions">
        <AButton
          ghost
          block
          class="reservation-form__action reservation-form__action--ghost"
          @click="goToStep(0)"
        >
          返回條件
        </AButton>
        <AButton
          type="primary"
          block
          class="reservation-form__action reservation-form__action--primary"
          :disabled="!formState.selectedSlotId"
          @click="goToStep(2)"
        >
          下一步
        </AButton>
      </ASpace>
    </section>

    <section v-else class="reservation-form__section">
      <AAlert
        v-if="businessError && !isSuccessVisible"
        type="warning"
        show-icon
        class="reservation-form__alert"
      >
        <template #message>
          <strong>{{ businessError.title }}</strong>
        </template>
        <template #description>
          <p>{{ businessError.description }}</p>
          <div v-if="alternateSlots.length" class="reservation-form__alternate">
            <ATypography.Text strong>其他可選時段：</ATypography.Text>
            <div class="reservation-form__alternate-list">
              <AButton
                v-for="slot in alternateSlots"
                :key="slot.slotId"
                size="small"
                @click="handleAlternateSelect(slot.slotId)"
              >
                {{ slot.start }} - {{ slot.end }}
              </AButton>
            </div>
          </div>
        </template>
      </AAlert>

      <AResult
        v-if="isSuccessVisible"
        status="success"
        :title="`成功預約 ${restaurantName ?? '餐廳'}`"
        :sub-title="`訂位代碼：${successReservation?.code}`"
      >
        <template #extra>
          <ASpace direction="vertical" style="width: 100%">
            <AButton type="primary" block @click="handleViewRestaurant">查看餐廳詳情</AButton>
            <AButton block @click="handleStartOver">預約另一個時段</AButton>
          </ASpace>
        </template>
      </AResult>
      <template v-else>
        <ATypography.Paragraph class="reservation-form__summary">
          <ATag color="gold" class="reservation-form__summary-tag">{{ selectedDate }}</ATag>
          <span v-if="selectedSlotSummary">{{ selectedSlotSummary }}</span>
          <span>・{{ partySize }} 位</span>
        </ATypography.Paragraph>
        <AForm ref="contactFormRef" layout="vertical" :model="contact" :rules="contactRules">
          <AForm.Item label="聯絡人姓名" name="name">
            <AInput v-model:value="contact.name" name="contact-name" autocomplete="name" />
          </AForm.Item>
          <AForm.Item label="聯絡電話" name="phone">
            <AInput v-model:value="contact.phone" name="contact-phone" autocomplete="tel" />
          </AForm.Item>
          <AForm.Item label="聯絡 Email" name="email">
            <AInput v-model:value="contact.email" name="contact-email" autocomplete="email" />
          </AForm.Item>
          <AForm.Item label="備註" name="notes">
            <AInput.TextArea v-model:value="contact.notes" name="contact-notes" :rows="3" />
          </AForm.Item>
        </AForm>
        <ASpace class="reservation-form__actions">
          <AButton
            ghost
            block
            class="reservation-form__action reservation-form__action--ghost"
            @click="goToStep(1)"
          >
            返回時段
          </AButton>
          <AButton
            type="primary"
            block
            class="reservation-form__action reservation-form__action--primary"
            :disabled="!canSubmit"
            :loading="submitting"
            @click="handleSubmit"
          >
            送出訂位
          </AButton>
        </ASpace>
      </template>
    </section>
  </section>
</template>

<style scoped>
.reservation-form {
  background: rgba(9, 12, 22, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--mh-radius-card);
  padding: var(--mh-spacing-lg);
}

.reservation-form__title {
  color: #fff;
  margin-bottom: var(--mh-spacing-md);
}

.reservation-form__steps {
  margin-bottom: var(--mh-spacing-lg);
}

.reservation-form__steps :deep(.ant-steps-item) {
  min-width: 0;
}

.reservation-form__steps :deep(.ant-steps-item-content) {
  min-width: 0;
}

.reservation-form__steps :deep(.ant-steps-item-container) {
  cursor: pointer;
}

.reservation-form__steps :deep(.ant-steps-item-title),
.reservation-form__steps :deep(.ant-steps-item-description),
.reservation-form__steps :deep(.ant-steps-item-title > span),
.reservation-form__steps :deep(.ant-steps-item-description > span) {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 600;
  text-align: center;
  white-space: normal;
  word-break: break-word;
}

.reservation-form__steps :deep(.ant-steps-item-title) {
  font-size: 1.02rem;
  line-height: 1.3;
}

.reservation-form__steps :deep(.ant-steps-item-description) {
  min-height: 34px;
  line-height: 1.3;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.72) !important;
}

.reservation-form__steps :deep(.ant-steps-item-icon) {
  background: rgba(212, 175, 55, 0.15);
  border-color: rgba(212, 175, 55, 0.45);
}

.reservation-form__steps :deep(.ant-steps-item-process .ant-steps-item-icon) {
  background: rgba(212, 175, 55, 0.95);
  border-color: rgba(212, 175, 55, 0.95);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
}

.reservation-form__steps :deep(.ant-steps-item-process .ant-steps-icon) {
  color: #fff;
}

.reservation-form__steps :deep(.ant-steps-item-tail::after) {
  background-color: rgba(212, 175, 55, 0.28) !important;
}

.reservation-form__section {
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-md);
}

.reservation-form__actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--mh-spacing-sm);
}

.reservation-form__action {
  font-size: 1rem;
  height: 48px;
  border-radius: 999px;
}

.reservation-form__action--ghost {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.06);
}

.reservation-form__action--ghost:hover {
  border-color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.12);
}

.reservation-form__action--primary {
  box-shadow: 0 12px 24px rgba(212, 175, 55, 0.25);
}

.reservation-form__action:deep(.ant-btn[disabled]) {
  background: rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.45) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  box-shadow: none !important;
}

.reservation-form__actions :deep(.ant-btn) {
  font-size: 1rem;
  height: 48px;
  border-radius: 999px;
}

.reservation-form__actions :deep(.ant-btn[disabled]) {
  background: rgba(255, 255, 255, 0.08) !important;
  color: rgba(255, 255, 255, 0.45) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.reservation-form__placeholder {
  text-align: center;
  color: var(--mh-color-text-muted);
  padding: var(--mh-spacing-lg);
  background: rgba(28, 33, 54, 0.4);
  border-radius: var(--mh-radius-card);
}

.reservation-form__alert {
  border-radius: var(--mh-radius-card);
}

.reservation-form__alternate {
  margin-top: var(--mh-spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-xs);
}

.reservation-form__alternate-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mh-spacing-xs);
}

.reservation-form__summary {
  color: #fff;
  display: flex;
  align-items: center;
  gap: var(--mh-spacing-xs);
}

.reservation-form__summary-tag {
  border: none;
  background: rgba(212, 175, 55, 0.12);
  color: var(--mh-color-accent);
}

@media (max-width: 768px) {
  .reservation-form {
    padding: var(--mh-spacing-md);
  }

  .reservation-form__steps :deep(.ant-steps-item-title) {
    font-size: 0.95rem;
  }

  .reservation-form__steps :deep(.ant-steps-item-description) {
    font-size: 0.88rem;
  }
}
</style>
