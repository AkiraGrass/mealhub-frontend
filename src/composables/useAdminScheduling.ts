import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAdminStore } from '@/stores/admin.store';
import type {
  AdminReservationsParams,
  InviteRestaurantAdminPayload,
  TimeslotPayload
} from '@/services/api/admin.api';
import type { TableBucket } from '@/types/reservation';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const assertDate = (value: string): void => {
  if (!DATE_PATTERN.test(value)) {
    throw new Error('date must be formatted as YYYY-MM-DD');
  }
};

const assertRestaurantId = (value: number | string): void => {
  if (value === null || value === undefined || value === '') {
    throw new Error('restaurantId is required');
  }
};

const assertTimeslotPayload = (payload: TimeslotPayload & { slotId?: string }): void => {
  if (!payload.start || !payload.end) {
    throw new Error('timeslot start and end are required');
  }
  if (new Date(payload.start).getTime() >= new Date(payload.end).getTime()) {
    throw new Error('timeslot end must be after start');
  }
  if (payload.capacity <= 0) {
    throw new Error('timeslot capacity must be greater than zero');
  }
};

const assertBuckets = (buckets: TableBucket[]): void => {
  buckets.forEach((bucket) => {
    if (bucket.size <= 0 || bucket.capacity <= 0) {
      throw new Error('table bucket size and capacity must be positive');
    }
  });
};

const assertAdminPayload = (payload: InviteRestaurantAdminPayload): void => {
  if (!payload.name.trim()) {
    throw new Error('admin name is required');
  }
  if (!payload.email.includes('@')) {
    throw new Error('admin email must be valid');
  }
};

export const useAdminScheduling = () => {
  const store = useAdminStore();
  const {
    restaurantId,
    selectedDate,
    selectedTimeslot,
    reservations,
    slots,
    tableBuckets,
    admins,
    isLoadingDashboard,
    dashboardError,
    permissionDenied,
    dashboardTimeout,
    isSavingTimeslot,
    isSavingBuckets,
    isSavingMembers,
    isCancellingReservation,
    mutationErrorCode,
    hasActiveAdmin
  } = storeToRefs(store);

  const dashboardEmpty = computed(
    () =>
      !isLoadingDashboard.value &&
      !dashboardError.value &&
      !permissionDenied.value &&
      reservations.value.length === 0
  );

  const loadDashboard = async (
    restaurant: number | string,
    params: AdminReservationsParams = {},
    options: { force?: boolean } = {}
  ): Promise<void> => {
    assertRestaurantId(restaurant);
    if (params.date) {
      assertDate(params.date);
    }
    await store.loadDashboard(restaurant, params, options);
  };

  const saveTimeslot = async (payload: TimeslotPayload & { slotId?: string }): Promise<void> => {
    assertTimeslotPayload(payload);
    await store.saveTimeslot(payload);
  };

  const removeTimeslot = async (slotId: string): Promise<void> => {
    if (!slotId) {
      throw new Error('slotId is required');
    }
    await store.removeTimeslot(slotId);
  };

  const saveTableBuckets = async (buckets: TableBucket[]): Promise<void> => {
    assertBuckets(buckets);
    await store.saveTableBuckets(buckets);
  };

  const inviteAdmin = async (payload: InviteRestaurantAdminPayload): Promise<void> => {
    assertAdminPayload(payload);
    await store.inviteAdmin(payload);
  };

  const removeAdmin = async (adminId: string): Promise<void> => {
    if (!adminId) {
      throw new Error('adminId is required');
    }
    await store.removeAdmin(adminId);
  };

  const cancelReservation = async (reservationId: string): Promise<void> => {
    if (!reservationId) {
      throw new Error('reservationId is required');
    }
    await store.cancelReservation(reservationId);
  };

  return {
    restaurantId,
    selectedDate,
    selectedTimeslot,
    reservations,
    slots,
    tableBuckets,
    admins,
    isLoadingDashboard,
    dashboardError,
    permissionDenied,
    dashboardTimeout,
    isSavingTimeslot,
    isSavingBuckets,
    isSavingMembers,
    isCancellingReservation,
    mutationErrorCode,
    hasActiveAdmin,
    dashboardEmpty,
    loadDashboard,
    refreshAdmins: store.refreshAdmins,
    saveTimeslot,
    removeTimeslot,
    saveTableBuckets,
    inviteAdmin,
    removeAdmin,
    cancelReservation,
    updateRestaurantSettings: store.updateRestaurantSettings,
    clearMutationError: store.clearMutationError
  };
};
