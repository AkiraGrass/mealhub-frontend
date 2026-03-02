<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Button as AButton,
  Card as ACard,
  Form as AForm,
  Input as AInput,
  Tabs as ATabs,
  Typography as ATypography
} from 'ant-design-vue';
import PageShell from '@/components/layout/PageShell.vue';
import RequestState from '@/components/state/RequestState.vue';
import { useReservations } from '@/composables/useReservations';
import { useRouter } from 'vue-router';

const router = useRouter();
const reservationsApi = useReservations();
const {
  lookupReservation,
  lookupError,
  lookupTimeout,
  lookupPermissionDenied,
  isLookingUpReservation
} = reservationsApi;

const activeTab = ref<'code' | 'short'>('code');
const codeValue = ref('');
const tokenValue = ref('');
const hasLookupAttempt = ref(false);

const handleLookup = async (): Promise<void> => {
  hasLookupAttempt.value = true;
  try {
    if (activeTab.value === 'code') {
      await reservationsApi.lookupReservationByCode(codeValue.value);
    } else {
      await reservationsApi.lookupReservationByShortToken(tokenValue.value);
    }
  } catch {
    // handled via store state
  }
};

const resetLookup = (): void => {
  reservationsApi.resetLookupState();
  hasLookupAttempt.value = false;
};

const resultTitle = computed(() => {
  if (!lookupReservation.value) {
    return '';
  }
  return `訂位碼 ${lookupReservation.value.code}`;
});

const resultDescription = computed(() => {
  if (!lookupReservation.value) {
    return '';
  }
  const res = lookupReservation.value;
  return `餐廳 ${res.restaurantId} · 日期 ${res.date} · 時段 ${res.start} - ${res.end} · 人數 ${res.partySize} 位`;
});

const gotoLogin = (): void => {
  void router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
};
</script>

<template>
  <PageShell title="訂位碼查詢">
    <ACard class="lookup-card" bordered>
      <ATabs v-model:active-key="activeTab">
        <ATabs.TabPane key="code" tab="輸入訂位碼">
          <AForm layout="vertical" @submit.prevent="handleLookup">
            <AForm.Item label="訂位碼">
              <AInput v-model:value="codeValue" placeholder="例如 ABC123" />
            </AForm.Item>
            <AButton type="primary" :loading="isLookingUpReservation" @click="handleLookup">
              查詢
            </AButton>
          </AForm>
        </ATabs.TabPane>
        <ATabs.TabPane key="short" tab="輸入短碼">
          <AForm layout="vertical" @submit.prevent="handleLookup">
            <AForm.Item label="短碼">
              <AInput v-model:value="tokenValue" placeholder="例如 ZX9K" />
            </AForm.Item>
            <AButton type="primary" :loading="isLookingUpReservation" @click="handleLookup">
              查詢
            </AButton>
          </AForm>
        </ATabs.TabPane>
      </ATabs>
    </ACard>

    <section class="lookup-result">
      <RequestState
        :loading="isLookingUpReservation"
        :error="hasLookupAttempt ? lookupError : null"
        :timeout="lookupTimeout"
        :permission-denied="lookupPermissionDenied"
        :empty="hasLookupAttempt && !lookupReservation && !lookupError"
        @retry="handleLookup"
        @reauth="gotoLogin"
      >
        <ACard v-if="lookupReservation" bordered class="result-card">
          <ATypography.Title :level="5">{{ resultTitle }}</ATypography.Title>
          <ATypography.Paragraph>{{ resultDescription }}</ATypography.Paragraph>
          <ATypography.Paragraph v-if="lookupReservation.notes">
            備註：{{ lookupReservation.notes }}
          </ATypography.Paragraph>
          <AButton type="default" @click="resetLookup">清除結果</AButton>
        </ACard>
        <ATypography.Paragraph v-else class="lookup-placeholder">
          請輸入訂位碼或短碼進行查詢。
        </ATypography.Paragraph>
      </RequestState>
    </section>
  </PageShell>
</template>

<style scoped>
.lookup-card {
  margin-bottom: var(--mh-spacing-xl);
}

.lookup-result {
  min-height: 260px;
}

.result-card {
  background: rgba(12, 16, 27, 0.85);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.lookup-placeholder {
  color: var(--mh-color-text-muted, rgba(255, 255, 255, 0.7));
}
</style>
