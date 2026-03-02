<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Button as AButton,
  DatePicker as ADatePicker,
  Space as ASpace,
  Typography as ATypography,
  message as messageApi
} from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import PageShell from '@/components/layout/PageShell.vue';
import RequestState from '@/components/state/RequestState.vue';
import AdminSummaryCards from '@/components/admin/AdminSummaryCards.vue';
import AdminReservationsTable from '@/components/admin/AdminReservationsTable.vue';
import AdminAvailabilityChart from '@/components/admin/AdminAvailabilityChart.vue';
import TimeslotEditorDrawer from '@/components/admin/TimeslotEditorDrawer.vue';
import TableBucketEditor from '@/components/admin/TableBucketEditor.vue';
import AdminMembersPanel from '@/components/admin/AdminMembersPanel.vue';
import { useAdminScheduling } from '@/composables/useAdminScheduling';
import type { InviteRestaurantAdminPayload, TimeslotPayload } from '@/services/api/admin.api';
import type { TableBucket } from '@/types/reservation';

const router = useRouter();
const route = useRoute();
const admin = useAdminScheduling();
const message = messageApi;

const dateValue = ref<string | null>(null);
const timeslotDrawerOpen = ref(false);
const cancellingReservationId = ref<string | null>(null);

watch(
  () => admin.selectedDate.value,
  (value: string | null | undefined) => {
    dateValue.value = value || null;
  },
  { immediate: true }
);

const currentRestaurantId = computed(() => route.params.restaurantId as string | undefined);

const totalReservations = computed(() => admin.reservations.value.length);
const managementDisabled = computed(
  () => admin.permissionDenied.value || !admin.hasActiveAdmin.value
);
const cancellationDisabled = computed(() => admin.permissionDenied.value);

const formattedDateLabel = computed(() => {
  if (!admin.selectedDate.value) {
    return '未選擇日期';
  }
  try {
    return new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' }).format(new Date(admin.selectedDate.value));
  } catch {
    return admin.selectedDate.value;
  }
});

const ensureDashboardLoaded = async (params?: { date?: string; force?: boolean }): Promise<void> => {
  const restaurantId = currentRestaurantId.value;
  if (!restaurantId) {
    return;
  }
  await admin.loadDashboard(
    restaurantId,
    { date: params?.date ?? admin.selectedDate.value },
    { force: params?.force }
  );
  await admin.refreshAdmins(restaurantId);
};

watch(
  () => currentRestaurantId.value,
  (restaurantId: string | undefined) => {
    if (restaurantId) {
      void ensureDashboardLoaded();
    }
  },
  { immediate: true }
);

const handleDateChange = (value: string | null): void => {
  const nextDate = value || admin.selectedDate.value;
  if (!nextDate) {
    return;
  }
  dateValue.value = nextDate;
  void ensureDashboardLoaded({ date: nextDate });
};

const handleRetry = (): void => {
  void ensureDashboardLoaded({ date: admin.selectedDate.value });
};

const handleRefresh = async (): Promise<void> => {
  try {
    await ensureDashboardLoaded({ date: admin.selectedDate.value, force: true });
  } catch {
    message.warning('重新整理失敗，請稍後再試');
  }
};

const handleReauth = (): void => {
  void router.push({ name: 'login', query: { redirect: route.fullPath } });
};

const handleBackToList = (): void => {
  void router.push({ name: 'restaurants-list' });
};

const openTimeslotDrawer = (): void => {
  admin.clearMutationError();
  timeslotDrawerOpen.value = true;
};

const closeTimeslotDrawer = (): void => {
  timeslotDrawerOpen.value = false;
  admin.clearMutationError();
};

const handleSaveTimeslot = async (payload: TimeslotPayload & { slotId?: string }): Promise<void> => {
  try {
    await admin.saveTimeslot(payload);
    message.success(payload.slotId ? '時段已更新' : '時段已建立');
    timeslotDrawerOpen.value = false;
  } catch {
    message.warning('時段更新失敗，請檢查衝突提示');
  }
};

const handleRemoveTimeslot = async (slotId: string): Promise<void> => {
  try {
    await admin.removeTimeslot(slotId);
    message.success('時段已移除');
  } catch {
    message.warning('時段移除失敗，請稍後再試');
  }
};

const handleSaveBuckets = async (buckets: TableBucket[]): Promise<void> => {
  try {
    await admin.saveTableBuckets(buckets);
    message.success('座位 bucket 已更新');
  } catch {
    message.warning('座位 bucket 更新失敗，請確認是否有衝突');
  }
};

const handleInviteAdmin = async (payload: InviteRestaurantAdminPayload): Promise<void> => {
  try {
    await admin.inviteAdmin(payload);
    message.success('已送出管理員邀請');
  } catch {
    message.warning('邀請失敗，請檢查輸入資訊');
  }
};

const handleRemoveAdmin = async (adminId: string): Promise<void> => {
  try {
    await admin.removeAdmin(adminId);
    message.success('管理員已移除');
  } catch {
    message.warning('無法移除管理員，請確認至少保留一位 active 管理員');
  }
};

const handleCancelReservation = async (reservationId: string): Promise<void> => {
  cancellingReservationId.value = reservationId;
  try {
    await admin.cancelReservation(reservationId);
    message.success('已取消預約');
    try {
      await ensureDashboardLoaded({ date: admin.selectedDate.value, force: true });
    } catch {
      message.warning('取消成功，但重新整理失敗，請手動重整');
    }
  } catch {
    message.warning('取消預約失敗，請稍後再試');
  } finally {
    cancellingReservationId.value = null;
  }
};
</script>

<template>
  <PageShell title="Admin Dashboard" layout="wide">
    <RequestState
      :loading="admin.isLoadingDashboard.value"
      :error="admin.dashboardError.value"
      :empty="admin.dashboardEmpty.value"
      :permission-denied="admin.permissionDenied.value"
      :timeout="admin.dashboardTimeout.value"
      @retry="handleRetry"
      @reauth="handleReauth"
    >
      <section class="admin-dashboard">
        <div class="admin-dashboard__filters">
          <ASpace size="middle" wrap>
            <ATypography.Text strong class="admin-dashboard__label">查看日期</ATypography.Text>
            <ADatePicker
              v-model:value="dateValue"
              input-read-only
              value-format="YYYY-MM-DD"
              :allow-clear="false"
              @change="handleDateChange"
            />
            <AButton
              type="primary"
              ghost
              :loading="admin.isLoadingDashboard.value"
              @click="handleRefresh"
            >
              重新整理
            </AButton>
            <AButton v-if="admin.permissionDenied.value" danger ghost @click="handleBackToList">
              返回餐廳列表
            </AButton>
          </ASpace>
          <ATypography.Text type="secondary" class="admin-dashboard__count">
            {{ totalReservations }} 筆預約
          </ATypography.Text>
        </div>

        <AdminSummaryCards
          :slots="admin.slots.value"
          :table-buckets="admin.tableBuckets.value"
          :date-label="formattedDateLabel"
        />

        <AdminAvailabilityChart :slots="admin.slots.value" />

        <AdminReservationsTable
          :reservations="admin.reservations.value"
          :slots="admin.slots.value"
          :loading="admin.isLoadingDashboard.value"
          :can-cancel="!cancellationDisabled"
          :cancelling-reservation-id="cancellingReservationId"
          @cancel="handleCancelReservation"
        />

        <section class="admin-dashboard__management">
          <div class="admin-dashboard__management-header">
            <ATypography.Title :level="4">管理設定</ATypography.Title>
            <AButton
              type="primary"
              :disabled="managementDisabled"
              @click="openTimeslotDrawer"
            >
              編輯時段
            </AButton>
          </div>
          <TableBucketEditor
            :buckets="admin.tableBuckets.value"
            :saving="admin.isSavingBuckets.value"
            :disabled="managementDisabled"
            :error-code="admin.mutationErrorCode.value"
            @save="handleSaveBuckets"
          />
          <AdminMembersPanel
            :admins="admin.admins.value"
            :saving="admin.isSavingMembers.value"
            :disabled="managementDisabled"
            :error-code="admin.mutationErrorCode.value"
            @invite="handleInviteAdmin"
            @remove="handleRemoveAdmin"
          />
        </section>

        <TimeslotEditorDrawer
          :open="timeslotDrawerOpen"
          :slots="admin.slots.value"
          :saving="admin.isSavingTimeslot.value"
          :disabled="managementDisabled"
          :error-code="admin.mutationErrorCode.value"
          @close="closeTimeslotDrawer"
          @save="handleSaveTimeslot"
          @remove="handleRemoveTimeslot"
        />
      </section>
    </RequestState>
  </PageShell>
</template>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-xl);
}

.admin-dashboard__filters {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--mh-spacing-md);
  align-items: center;
  background: rgba(12, 15, 25, 0.85);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--mh-radius-card);
  padding: var(--mh-spacing-md) var(--mh-spacing-lg);
}

.admin-dashboard__label {
  color: var(--mh-color-text-secondary, #c0c6d8);
}

.admin-dashboard__count {
  font-size: 0.9rem;
}

.admin-dashboard__management {
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-md);
}

.admin-dashboard__management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--mh-spacing-sm);
}

@media (max-width: 768px) {
  .admin-dashboard__filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-dashboard__count {
    width: 100%;
    text-align: left;
  }

  .admin-dashboard__management-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
