<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message as messageApi } from 'ant-design-vue';
import PageShell from '@/components/layout/PageShell.vue';
import RequestState from '@/components/state/RequestState.vue';
import MyReservationsList from '@/components/reservations/MyReservationsList.vue';
import ReservationActionsDrawer from '@/components/reservations/ReservationActionsDrawer.vue';
import { useReservations } from '@/composables/useReservations';

const reservationsApi = useReservations();
const {
  reservations,
  isLoadingReservations,
  errorMessage,
  isProcessingReservation
} = reservationsApi;

const selectedReservation = ref<typeof reservations.value[number] | null>(null);
const drawerOpen = computed(() => Boolean(selectedReservation.value));
const pageEmpty = computed(
  () => !isLoadingReservations.value && reservations.value.length === 0 && !errorMessage.value
);

const message = messageApi;

const loadReservations = async (): Promise<void> => {
  await reservationsApi.loadMyReservations();
};

onMounted(() => {
  void loadReservations();
});

const handleManageReservation = (reservation: typeof reservations.value[number]): void => {
  if (reservation.status === 'cancelled') {
    message.warning('此訂位已取消，請重新建立新訂位');
    return;
  }
  selectedReservation.value = reservation;
};

const closeDrawer = (): void => {
  selectedReservation.value = null;
};

const handleSave = async (payload: { slotId?: string; partySize?: number; notes?: string }): Promise<void> => {
  if (!selectedReservation.value) {
    return;
  }
  try {
    await reservationsApi.modifyReservation(selectedReservation.value.id, {
      ...payload,
      restaurantId: selectedReservation.value.restaurantId
    });
    message.success('已更新訂位');
    await loadReservations();
    closeDrawer();
  } catch (error) {
    message.error((error as Error).message || '更新失敗');
  }
};

const handleCancelReservation = async (): Promise<void> => {
  if (!selectedReservation.value) {
    return;
  }
  try {
    await reservationsApi.cancelReservation(selectedReservation.value.id, {
      restaurantId: selectedReservation.value.restaurantId
    });
    message.success('已取消訂位');
    await loadReservations();
    closeDrawer();
  } catch (error) {
    message.error((error as Error).message || '取消失敗');
  }
};
</script>

<template>
  <PageShell title="我的訂位">
    <RequestState
      :loading="isLoadingReservations"
      :error="errorMessage"
      :empty="pageEmpty"
      @retry="loadReservations"
    >
      <section v-if="reservations.length" class="my-reservations-page">
        <MyReservationsList :reservations="reservations" @manage="handleManageReservation" />
      </section>
    </RequestState>

    <ReservationActionsDrawer
      :open="drawerOpen"
      :reservation="selectedReservation"
      :loading="isProcessingReservation"
      @close="closeDrawer"
      @save="handleSave"
      @cancel-reservation="handleCancelReservation"
    />
  </PageShell>
</template>

<style scoped>
.my-reservations-page {
  margin-top: var(--mh-spacing-lg);
}
</style>
