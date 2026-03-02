import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { fetchAvailabilityDetailApi } from '@/services/api/availability.api';
import {
  cancelAdminReservationApi,
  createTimeslotApi,
  deleteTimeslotApi,
  fetchAdminReservationsApi,
  fetchRestaurantAdminsApi,
  inviteRestaurantAdminApi,
  removeRestaurantAdminApi,
  updateTimeslotApi,
  updateRestaurantSettingsApi,
  type AdminReservationsParams,
  type InviteRestaurantAdminPayload,
  type TimeslotPayload,
  type UpdateRestaurantSettingsPayload
} from '@/services/api/admin.api';
import type {
  AvailabilitySlot,
  Reservation,
  RestaurantAdmin,
  TableBucket
} from '@/types/reservation';
import type { RestaurantDetail } from '@/types/restaurant';
import { trackEvent } from '@/utils/telemetry';

interface ApiError extends Error {
  code?: string;
  response?: {
    status?: number;
    data?: {
      code?: string;
      message?: string;
    };
  };
}

const today = (): string => new Date().toISOString().slice(0, 10);

const isTimeoutError = (error: ApiError | undefined): boolean => error?.code === 'ECONNABORTED';
const isPermissionError = (error: ApiError | undefined): boolean => error?.response?.status === 403;
const extractErrorCode = (error: ApiError | undefined): string =>
  error?.response?.data?.code ||
  error?.response?.data?.message ||
  error?.code ||
  error?.message ||
  'unknown_error';
const extractErrorMessage = (error: ApiError | undefined): string =>
  error?.response?.data?.message || error?.message || '目前無法載入管理儀表板，請稍後再試';
const toSlotId = (start: string, end: string): string => `${start}-${end}`;

const normalizeSlot = (slot: Partial<AvailabilitySlot> & { start: string; end: string }): AvailabilitySlot => ({
  slotId: slot.slotId || toSlotId(slot.start, slot.end),
  start: slot.start,
  end: slot.end,
  capacity: slot.capacity ?? 0,
  reserved: slot.reserved ?? 0,
  available: slot.available ?? Math.max((slot.capacity ?? 0) - (slot.reserved ?? 0), 0),
  byPartySize: slot.byPartySize ?? [],
  notes: slot.notes
});

interface DashboardSnapshot {
  reservations: Reservation[];
  slots: AvailabilitySlot[];
  tableBuckets: TableBucket[];
  fetchedAt: number;
}

const buildCacheKey = (restaurant: number | string, date: string, timeslot: string | null): string =>
  `${restaurant}::${date || 'all'}::${timeslot ?? 'all'}`;

type LoadOptions = { force?: boolean };

export const useAdminStore = defineStore('admin', () => {
  const restaurantId = ref<number | string | null>(null);
  const selectedDate = ref<string>(today());
  const selectedTimeslot = ref<string | null>(null);
  const reservations = ref<Reservation[]>([]);
  const slots = ref<AvailabilitySlot[]>([]);
  const tableBuckets = ref<TableBucket[]>([]);
  const admins = ref<RestaurantAdmin[]>([]);
  const isLoadingDashboard = ref(false);
  const dashboardError = ref<string | null>(null);
  const permissionDenied = ref(false);
  const dashboardTimeout = ref(false);
  const isSavingTimeslot = ref(false);
  const isSavingBuckets = ref(false);
  const isSavingMembers = ref(false);
  const isCancellingReservation = ref(false);
  const mutationErrorCode = ref<string | null>(null);

  const dashboardCache = new Map<string, DashboardSnapshot>();

  const hasActiveAdmin = computed(() => admins.value.some((admin) => admin.status === 'active'));

  const applySnapshot = (snapshot: DashboardSnapshot): void => {
    reservations.value = [...snapshot.reservations];
    slots.value = [...snapshot.slots];
    tableBuckets.value = [...snapshot.tableBuckets];
  };

  const invalidateDashboardCache = (restaurant?: number | string, date?: string): void => {
    if (!restaurant) {
      dashboardCache.clear();
      return;
    }
    const prefix = `${restaurant}::`;
    Array.from(dashboardCache.keys()).forEach((key) => {
      if (!key.startsWith(prefix)) {
        return;
      }
      if (!date) {
        dashboardCache.delete(key);
        return;
      }
      const [, keyDate] = key.split('::');
      if (keyDate === (date || 'all')) {
        dashboardCache.delete(key);
      }
    });
  };

  const reloadDashboard = async (): Promise<void> => {
    if (!restaurantId.value) {
      return;
    }
    await loadDashboard(
      restaurantId.value,
      { date: selectedDate.value, timeslot: selectedTimeslot.value ?? undefined },
      { force: true }
    );
  };

  const loadDashboard = async (
    restaurant: number | string,
    params: AdminReservationsParams = {},
    options: LoadOptions = {}
  ): Promise<void> => {
    const normalizedDate = params.date || selectedDate.value || today();
    const normalizedTimeslot = params.timeslot ?? null;

    restaurantId.value = restaurant;
    selectedDate.value = normalizedDate;
    selectedTimeslot.value = normalizedTimeslot;

    const cacheKey = buildCacheKey(restaurant, normalizedDate, normalizedTimeslot);
    if (!options.force) {
      const cached = dashboardCache.get(cacheKey);
      if (cached) {
        applySnapshot(cached);
        dashboardError.value = null;
        permissionDenied.value = false;
        dashboardTimeout.value = false;
        return;
      }
    }

    isLoadingDashboard.value = true;
    dashboardError.value = null;
    permissionDenied.value = false;
    dashboardTimeout.value = false;

    try {
      const [reservationList, availabilityDetail] = await Promise.all([
        fetchAdminReservationsApi(restaurant, {
          date: normalizedDate,
          timeslot: normalizedTimeslot ?? undefined
        }),
        fetchAvailabilityDetailApi({ restaurantId: restaurant, date: normalizedDate })
      ]);

      const normalizedReservations = Array.isArray(reservationList) ? reservationList : [];
      const snapshot: DashboardSnapshot = {
        reservations: normalizedReservations,
        slots: availabilityDetail.slots,
        tableBuckets: availabilityDetail.tableBuckets,
        fetchedAt: Date.now()
      };

      applySnapshot(snapshot);
      dashboardCache.set(cacheKey, snapshot);

      trackEvent('admin_dashboard_load_success', {
        restaurantId: restaurant,
        date: normalizedDate,
        timeslot: normalizedTimeslot,
        reservations: normalizedReservations.length,
        slots: availabilityDetail.slots.length
      });
    } catch (error) {
      const apiError = error as ApiError;
      dashboardError.value = extractErrorMessage(apiError);
      permissionDenied.value = isPermissionError(apiError);
      dashboardTimeout.value = isTimeoutError(apiError);
      reservations.value = [];
      slots.value = [];
      tableBuckets.value = [];

      const telemetryPayload = {
        restaurantId: restaurant,
        date: normalizedDate,
        timeslot: normalizedTimeslot,
        error: extractErrorCode(apiError)
      };

      if (permissionDenied.value) {
        trackEvent('admin_dashboard_load_permission_denied', telemetryPayload);
      } else if (dashboardTimeout.value) {
        trackEvent('admin_dashboard_load_timeout', { ...telemetryPayload, reason: 'timeout' });
      } else {
        trackEvent('admin_dashboard_load_timeout', { ...telemetryPayload, reason: 'api_error' });
      }
    } finally {
      isLoadingDashboard.value = false;
    }
  };

  const refreshAdmins = async (restaurant: number | string): Promise<void> => {
    restaurantId.value = restaurant;
    const adminList = await fetchRestaurantAdminsApi(restaurant);
    admins.value = [...adminList];
  };

  const saveTimeslot = async (payload: TimeslotPayload & { slotId?: string }): Promise<void> => {
    if (!restaurantId.value) {
      throw new Error('restaurantId is not set');
    }
    isSavingTimeslot.value = true;
    mutationErrorCode.value = null;
    const previousSlots = [...slots.value];
    const optimisticSlotId = payload.slotId || `tmp-${Date.now()}`;
    const optimisticSlot = normalizeSlot({
      slotId: optimisticSlotId,
      start: payload.start,
      end: payload.end,
      capacity: payload.capacity,
      reserved: 0,
      available: payload.capacity,
      notes: payload.notes
    });
    if (payload.slotId) {
      const existingIndex = slots.value.findIndex((slot) => slot.slotId === payload.slotId);
      if (existingIndex >= 0) {
        slots.value.splice(existingIndex, 1, optimisticSlot);
      } else {
        slots.value.push(optimisticSlot);
      }
    } else {
      slots.value.push(optimisticSlot);
    }
    try {
      let savedSlot: AvailabilitySlot;
      if (payload.slotId) {
        const { slotId, ...partialPayload } = payload;
        savedSlot = normalizeSlot(
          await updateTimeslotApi(restaurantId.value, slotId, partialPayload)
        );
        const targetIndex = slots.value.findIndex((slot) => slot.slotId === slotId);
        if (targetIndex >= 0) {
          slots.value.splice(targetIndex, 1, savedSlot);
        }
      } else {
        savedSlot = normalizeSlot(await createTimeslotApi(restaurantId.value, payload));
        const tempIndex = slots.value.findIndex((slot) => slot.slotId === optimisticSlotId);
        if (tempIndex >= 0) {
          slots.value.splice(tempIndex, 1, savedSlot);
        }
      }
      trackEvent('admin_timeslot_update_success', {
        restaurantId: restaurantId.value,
        slotId: payload.slotId ?? null
      });
      invalidateDashboardCache(restaurantId.value, selectedDate.value);
      await reloadDashboard();
    } catch (error) {
      slots.value = previousSlots;
      mutationErrorCode.value = extractErrorCode(error as ApiError);
      trackEvent('admin_timeslot_update_error', {
        restaurantId: restaurantId.value,
        slotId: payload.slotId ?? null,
        error: mutationErrorCode.value
      });
      throw error;
    } finally {
      isSavingTimeslot.value = false;
    }
  };

  const removeTimeslot = async (slotId: string): Promise<void> => {
    if (!restaurantId.value) {
      throw new Error('restaurantId is not set');
    }
    isSavingTimeslot.value = true;
    mutationErrorCode.value = null;
    const previousSlots = [...slots.value];
    slots.value = slots.value.filter((slot) => slot.slotId !== slotId);
    try {
      await deleteTimeslotApi(restaurantId.value, slotId);
      trackEvent('admin_timeslot_update_success', {
        restaurantId: restaurantId.value,
        slotId,
        action: 'delete'
      });
      invalidateDashboardCache(restaurantId.value, selectedDate.value);
      await reloadDashboard();
    } catch (error) {
      slots.value = previousSlots;
      mutationErrorCode.value = extractErrorCode(error as ApiError);
      trackEvent('admin_timeslot_update_error', {
        restaurantId: restaurantId.value,
        slotId,
        error: mutationErrorCode.value
      });
      throw error;
    } finally {
      isSavingTimeslot.value = false;
    }
  };

  const saveTableBuckets = async (buckets: TableBucket[]): Promise<void> => {
    if (!restaurantId.value) {
      throw new Error('restaurantId is not set');
    }
    isSavingBuckets.value = true;
    mutationErrorCode.value = null;
    const previousBuckets = [...tableBuckets.value];
    tableBuckets.value = [...buckets];
    try {
      const detail = await updateRestaurantSettingsApi(restaurantId.value, { tableBuckets: buckets });
      tableBuckets.value = [...(detail.tableBuckets ?? [])];
      trackEvent('admin_bucket_update_success', {
        restaurantId: restaurantId.value,
        buckets: buckets.length
      });
      invalidateDashboardCache(restaurantId.value, selectedDate.value);
      await reloadDashboard();
    } catch (error) {
      tableBuckets.value = previousBuckets;
      mutationErrorCode.value = extractErrorCode(error as ApiError);
      trackEvent('admin_bucket_update_error', {
        restaurantId: restaurantId.value,
        error: mutationErrorCode.value
      });
      throw error;
    } finally {
      isSavingBuckets.value = false;
    }
  };

  const inviteAdmin = async (payload: InviteRestaurantAdminPayload): Promise<RestaurantAdmin> => {
    if (!restaurantId.value) {
      throw new Error('restaurantId is not set');
    }
    isSavingMembers.value = true;
    mutationErrorCode.value = null;
    const previousAdmins = [...admins.value];
    const tempId = `temp-${Date.now()}`;
    admins.value = [
      ...admins.value,
      {
        id: tempId,
        restaurantId: String(restaurantId.value),
        userId: tempId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        status: 'invited'
      }
    ];
    try {
      const created = await inviteRestaurantAdminApi(restaurantId.value, payload);
      admins.value = [...admins.value.filter((admin) => admin.id !== tempId), created];
      trackEvent('admin_member_update_success', {
        restaurantId: restaurantId.value,
        action: 'invite',
        adminId: created.id
      });
      return created;
    } catch (error) {
      admins.value = previousAdmins;
      mutationErrorCode.value = extractErrorCode(error as ApiError);
      trackEvent('admin_member_update_error', {
        restaurantId: restaurantId.value,
        action: 'invite',
        error: mutationErrorCode.value
      });
      throw error;
    } finally {
      isSavingMembers.value = false;
    }
  };

  const removeAdmin = async (adminId: string): Promise<void> => {
    if (!restaurantId.value) {
      throw new Error('restaurantId is not set');
    }
    const adminTarget = admins.value.find((admin) => admin.id === adminId);
    const activeCount = admins.value.filter((admin) => admin.status === 'active').length;
    if (adminTarget?.status === 'active' && activeCount <= 1) {
      mutationErrorCode.value = 'atLeastOneActiveAdminRequired';
      throw new Error('atLeastOneActiveAdminRequired');
    }
    isSavingMembers.value = true;
    mutationErrorCode.value = null;
    const previousAdmins = [...admins.value];
    admins.value = admins.value.filter((admin) => admin.id !== adminId);
    try {
      await removeRestaurantAdminApi(restaurantId.value, adminId);
      trackEvent('admin_member_update_success', {
        restaurantId: restaurantId.value,
        action: 'remove',
        adminId
      });
    } catch (error) {
      admins.value = previousAdmins;
      mutationErrorCode.value = extractErrorCode(error as ApiError);
      trackEvent('admin_member_update_error', {
        restaurantId: restaurantId.value,
        action: 'remove',
        adminId,
        error: mutationErrorCode.value
      });
      throw error;
    } finally {
      isSavingMembers.value = false;
    }
  };

  const updateRestaurantSettings = async (
    payload: UpdateRestaurantSettingsPayload
  ): Promise<RestaurantDetail> => {
    if (!restaurantId.value) {
      throw new Error('restaurantId is not set');
    }
    const detail = await updateRestaurantSettingsApi(restaurantId.value, payload);
    if (payload.tableBuckets) {
      tableBuckets.value = [...(detail.tableBuckets ?? [])];
      invalidateDashboardCache(restaurantId.value, selectedDate.value);
    }
    return detail;
  };

  const clearMutationError = (): void => {
    mutationErrorCode.value = null;
  };

  const cancelReservation = async (reservationId: string): Promise<void> => {
    if (!reservationId) {
      throw new Error('reservationId is required');
    }
    if (!restaurantId.value) {
      throw new Error('restaurantId is not set');
    }
    isCancellingReservation.value = true;
    mutationErrorCode.value = null;
    try {
      const success = await cancelAdminReservationApi(reservationId);
      if (!success) {
        throw new Error('cancelFailed');
      }
      const index = reservations.value.findIndex((reservation) => reservation.id === reservationId);
      if (index >= 0) {
        reservations.value[index] = {
          ...reservations.value[index],
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        };
      }
      trackEvent('reservation_cancel_success', {
        restaurantId: restaurantId.value,
        source: 'admin-dashboard',
        reservationId
      });
    } catch (error) {
      mutationErrorCode.value = extractErrorCode(error as ApiError);
      trackEvent('reservation_cancel_error', {
        restaurantId: restaurantId.value,
        source: 'admin-dashboard',
        reservationId,
        error: mutationErrorCode.value
      });
      throw error;
    } finally {
      isCancellingReservation.value = false;
    }
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
    loadDashboard,
    refreshAdmins,
    saveTimeslot,
    removeTimeslot,
    saveTableBuckets,
    inviteAdmin,
    removeAdmin,
    cancelReservation,
    updateRestaurantSettings,
    clearMutationError
  };
});
