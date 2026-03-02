import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  fetchRestaurantAvailabilityApi,
  fetchAvailabilityDetailApi
} from '@/services/api/availability.api';
import {
  cancelReservationApi,
  createReservationApi,
  fetchMyReservationsApi,
  fetchReservationByCodeApi,
  fetchReservationByShortTokenApi,
  updateReservationApi,
  type CreateReservationPayload,
  type UpdateReservationPayload
} from '@/services/api/reservations.api';
import type {
  AvailabilitySlot,
  Reservation,
  ReservationAuditEvent,
  ReservationBusinessError,
  ReservationFormState,
  TableBucket
} from '@/types/reservation';
import { trackEvent, trackReservationAudit } from '@/utils/telemetry';

interface ApiError extends Error {
  code?: string;
  userMessage?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

const RESERVATION_BUSINESS_ERRORS: ReservationBusinessError[] = [
  'sold_out',
  'already_reserved_this_restaurant',
  'no_capacity_for_party_size',
  'cannotModifyTimeslotActive',
  'cannotModifyTimeslotsActive'
];

const isTimeoutError = (error: ApiError | undefined): boolean => error?.code === 'ECONNABORTED';
const isPermissionError = (error: ApiError | undefined): boolean => error?.response?.status === 403;

const extractErrorCode = (error: ApiError | undefined): string | undefined =>
  error?.response?.data?.message || error?.userMessage;

const extractBusinessError = (error: ApiError | undefined): ReservationBusinessError | undefined => {
  const code = extractErrorCode(error);
  if (code && RESERVATION_BUSINESS_ERRORS.includes(code as ReservationBusinessError)) {
    return code as ReservationBusinessError;
  }
  return undefined;
};

const extractErrorMessage = (error: ApiError | undefined): string =>
  error?.userMessage || error?.message || '目前無法載入訂位資料，請稍後再試';

const today = (): string => new Date().toISOString().slice(0, 10);
const toIsoDatetime = (date: string, time: string): string => `${date}T${time}:00`;
type RuntimeCrypto = { randomUUID?: () => string };
const getCrypto = (): RuntimeCrypto | undefined => {
  if (typeof globalThis !== 'undefined' && typeof (globalThis as { crypto?: RuntimeCrypto }).crypto !== 'undefined') {
    return (globalThis as { crypto?: RuntimeCrypto }).crypto;
  }
  return undefined;
};
const generateAuditId = (): string => {
  const cryptoRef = getCrypto();
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const emitReservationAudit = (payload: {
  type: ReservationAuditEvent['type'];
  restaurantId: number | string;
  reservationId?: string;
  status: ReservationAuditEvent['status'];
  errorCode?: string;
}): void => {
  trackReservationAudit({
    eventId: generateAuditId(),
    type: payload.type,
    actorRole: 'customer',
    actorId: 'anonymous',
    restaurantId: String(payload.restaurantId),
    reservationId: payload.reservationId,
    status: payload.status,
    errorCode: payload.errorCode,
    timestamp: new Date().toISOString()
  });
};

export const useReservationsStore = defineStore('reservations', () => {
  const reservations = ref<Reservation[]>([]);
  const availability = ref<AvailabilitySlot[]>([]);
  const tableBuckets = ref<TableBucket[]>([]);
  const isLoadingAvailability = ref(false);
  const isLoadingReservations = ref(false);
  const isProcessingReservation = ref(false);
  const errorMessage = ref<string | null>(null);
  const availabilityTimeout = ref(false);
  const availabilityPermissionDenied = ref(false);
  const lookupReservation = ref<Reservation | null>(null);
  const isLookingUpReservation = ref(false);
  const lookupError = ref<string | null>(null);
  const lookupTimeout = ref(false);
  const lookupPermissionDenied = ref(false);
  const formState = ref<ReservationFormState>({
    selectedDate: today(),
    partySize: 2,
    availability: [],
    isSubmitting: false
  });

  const selectedSlot = computed<AvailabilitySlot | null>(() => {
    const slotId = formState.value.selectedSlotId;
    if (!slotId) {
      return null;
    }
    return availability.value.find((slot) => slot.slotId === slotId) ?? null;
  });

  const upsertReservation = (reservation: Reservation): void => {
    const index = reservations.value.findIndex((item) => item.id === reservation.id);
    if (index >= 0) {
      reservations.value[index] = reservation;
    } else {
      reservations.value.unshift(reservation);
    }
  };

  const resetLookupState = (): void => {
    lookupReservation.value = null;
    lookupError.value = null;
    lookupTimeout.value = false;
    lookupPermissionDenied.value = false;
  };

  const syncAvailabilityState = (slots: AvailabilitySlot[], buckets: TableBucket[] = []): void => {
    availability.value = slots;
    tableBuckets.value = buckets;
    formState.value.availability = slots;
  };

  const loadAvailability = async (
    restaurantId: number | string,
    date: string,
    partySize: number
  ): Promise<void> => {
    formState.value.selectedDate = date;
    formState.value.partySize = partySize;
    isLoadingAvailability.value = true;
    errorMessage.value = null;
    availabilityTimeout.value = false;
    availabilityPermissionDenied.value = false;
    trackEvent('reservation_action_start', { restaurantId, date, partySize, action: 'lookup' });
    try {
      const slots = await fetchRestaurantAvailabilityApi(restaurantId, { date, partySize });
      syncAvailabilityState(slots, tableBuckets.value);
      trackEvent('reservation_lookup_success', { restaurantId, date, slots: slots.length });
    } catch (error) {
      const apiError = error as ApiError;
      errorMessage.value = extractErrorMessage(apiError);
      availabilityPermissionDenied.value = isPermissionError(apiError);
      availabilityTimeout.value = isTimeoutError(apiError);
      if (availabilityPermissionDenied.value) {
        trackEvent('reservation_lookup_permission_denied', { restaurantId });
      } else if (availabilityTimeout.value) {
        trackEvent('reservation_lookup_timeout', { restaurantId, reason: 'timeout' });
      } else {
        trackEvent('reservation_lookup_timeout', { restaurantId, reason: apiError?.message ?? 'api_error' });
      }
      throw error;
    } finally {
      isLoadingAvailability.value = false;
    }
  };

  const loadAvailabilityDetail = async (
    restaurantId: number | string,
    date: string
  ): Promise<void> => {
    isLoadingAvailability.value = true;
    errorMessage.value = null;
    availabilityTimeout.value = false;
    availabilityPermissionDenied.value = false;
    formState.value.selectedDate = date;
    try {
      const detail = await fetchAvailabilityDetailApi({ restaurantId, date });
      syncAvailabilityState(detail.slots, detail.tableBuckets);
      trackEvent('reservation_lookup_success', {
        restaurantId,
        date,
        slots: detail.slots.length,
        source: 'detail'
      });
    } catch (error) {
      const apiError = error as ApiError;
      errorMessage.value = extractErrorMessage(apiError);
      availabilityPermissionDenied.value = isPermissionError(apiError);
      availabilityTimeout.value = isTimeoutError(apiError);
      throw error;
    } finally {
      isLoadingAvailability.value = false;
    }
  };

  const loadMyReservations = async (): Promise<void> => {
    isLoadingReservations.value = true;
    errorMessage.value = null;
    try {
      const items = await fetchMyReservationsApi();
      reservations.value = items;
      trackEvent('reservation_my_list_success', { count: items.length });
    } catch (error) {
      const apiError = error as ApiError;
      errorMessage.value = extractErrorMessage(apiError);
      trackEvent('reservation_my_list_error', { message: apiError?.message });
      throw error;
    } finally {
      isLoadingReservations.value = false;
    }
  };

  const lookupReservationByCode = async (code: string): Promise<Reservation> => {
    resetLookupState();
    isLookingUpReservation.value = true;
    const normalizedCode = code.trim();
    trackEvent('reservation_action_start', { action: 'lookup', method: 'code' });
    try {
      const reservation = await fetchReservationByCodeApi(normalizedCode);
      lookupReservation.value = reservation;
      trackEvent('reservation_lookup_success', { method: 'code', reservationId: reservation.id });
      return reservation;
    } catch (error) {
      const apiError = error as ApiError;
      lookupError.value = extractErrorMessage(apiError);
      lookupPermissionDenied.value = isPermissionError(apiError);
      lookupTimeout.value = isTimeoutError(apiError);
      if (lookupPermissionDenied.value) {
        trackEvent('reservation_lookup_permission_denied', { method: 'code' });
      } else if (lookupTimeout.value) {
        trackEvent('reservation_lookup_timeout', { method: 'code', reason: 'timeout' });
      } else {
        trackEvent('reservation_lookup_timeout', {
          method: 'code',
          reason: 'api_error',
          message: apiError?.message
        });
      }
      throw error;
    } finally {
      isLookingUpReservation.value = false;
    }
  };

  const lookupReservationByShortToken = async (token: string): Promise<Reservation> => {
    resetLookupState();
    isLookingUpReservation.value = true;
    const normalizedToken = token.trim();
    trackEvent('reservation_action_start', { action: 'lookup', method: 'short' });
    try {
      const reservation = await fetchReservationByShortTokenApi(normalizedToken);
      lookupReservation.value = reservation;
      trackEvent('reservation_lookup_success', { method: 'short', reservationId: reservation.id });
      return reservation;
    } catch (error) {
      const apiError = error as ApiError;
      lookupError.value = extractErrorMessage(apiError);
      lookupPermissionDenied.value = isPermissionError(apiError);
      lookupTimeout.value = isTimeoutError(apiError);
      if (lookupPermissionDenied.value) {
        trackEvent('reservation_lookup_permission_denied', { method: 'short' });
      } else if (lookupTimeout.value) {
        trackEvent('reservation_lookup_timeout', { method: 'short', reason: 'timeout' });
      } else {
        trackEvent('reservation_lookup_timeout', {
          method: 'short',
          reason: 'api_error',
          message: apiError?.message
        });
      }
      throw error;
    } finally {
      isLookingUpReservation.value = false;
    }
  };

  const createReservation = async (payload: CreateReservationPayload): Promise<Reservation> => {
    formState.value.isSubmitting = true;
    formState.value.businessError = undefined;
    formState.value.selectedDate = payload.date;
    formState.value.partySize = payload.partySize;
    formState.value.selectedSlotId = payload.slotId;
    trackEvent('reservation_action_start', {
      restaurantId: payload.restaurantId,
      slotId: payload.slotId,
      partySize: payload.partySize,
      action: 'create'
    });
    try {
      const createResult = await createReservationApi(payload);
      const slot = availability.value.find((item) => item.slotId === payload.slotId);
      const start = slot?.start ?? payload.slotId.split('-')[0] ?? '00:00';
      const end = slot?.end ?? payload.slotId.split('-')[1] ?? '00:00';
      const reservation: Reservation = {
        id: createResult.code,
        restaurantId: String(payload.restaurantId),
        date: payload.date,
        start: toIsoDatetime(payload.date, start),
        end: toIsoDatetime(payload.date, end),
        slotId: payload.slotId,
        partySize: payload.partySize,
        status: 'confirmed',
        code: createResult.code,
        shortToken: createResult.shortToken,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      upsertReservation(reservation);
      trackEvent('reservation_create_success', {
        restaurantId: payload.restaurantId,
        reservationId: reservation.id,
        partySize: reservation.partySize,
        slotId: payload.slotId
      });
      emitReservationAudit({
        type: 'reservation_create',
        restaurantId: payload.restaurantId,
        reservationId: reservation.id,
        status: 'success'
      });
      return reservation;
    } catch (error) {
      const apiError = error as ApiError;
      const businessError = extractBusinessError(apiError);
      formState.value.businessError = businessError;
      trackEvent('reservation_create_error', {
        restaurantId: payload.restaurantId,
        slotId: payload.slotId,
        partySize: payload.partySize,
        errorCode: businessError ?? extractErrorCode(apiError)
      });
      emitReservationAudit({
        type: 'reservation_create',
        restaurantId: payload.restaurantId,
        status: 'error',
        errorCode: businessError ?? extractErrorCode(apiError)
      });
      throw error;
    } finally {
      formState.value.isSubmitting = false;
    }
  };

  const modifyReservation = async (
    reservationId: string,
    payload: UpdateReservationPayload & { restaurantId: number | string; slotId?: string }
  ): Promise<Reservation> => {
    formState.value.isSubmitting = true;
    formState.value.businessError = undefined;
    isProcessingReservation.value = true;
    const { restaurantId, ...updatePayload } = payload;
    trackEvent('reservation_action_start', {
      restaurantId,
      slotId: payload.slotId,
      reservationId,
      action: 'modify'
    });
    try {
      const existingReservation = reservations.value.find((item) => item.id === reservationId);
      if (existingReservation?.status === 'cancelled') {
        const immutableError = new Error('此訂位已取消，請重新建立新訂位');
        (immutableError as ApiError).userMessage = immutableError.message;
        throw immutableError;
      }
      const reservation = await updateReservationApi(reservationId, updatePayload);
      upsertReservation(reservation);
      trackEvent('reservation_modify_success', {
        restaurantId,
        reservationId,
        slotId: payload.slotId
      });
      emitReservationAudit({
        type: 'reservation_modify',
        restaurantId,
        reservationId,
        status: 'success'
      });
      return reservation;
    } catch (error) {
      const apiError = error as ApiError;
      const businessError = extractBusinessError(apiError);
      formState.value.businessError = businessError;
      trackEvent('reservation_modify_error', {
        restaurantId,
        reservationId,
        slotId: payload.slotId,
        errorCode: businessError ?? extractErrorCode(apiError)
      });
      emitReservationAudit({
        type: 'reservation_modify',
        restaurantId,
        reservationId,
        status: 'error',
        errorCode: businessError ?? extractErrorCode(apiError)
      });
      throw error;
    } finally {
      formState.value.isSubmitting = false;
      isProcessingReservation.value = false;
    }
  };

  const cancelReservation = async (
    reservationId: string,
    context: { restaurantId: number | string }
  ): Promise<Reservation> => {
    formState.value.isSubmitting = true;
    isProcessingReservation.value = true;
    trackEvent('reservation_action_start', {
      restaurantId: context.restaurantId,
      reservationId,
      action: 'cancel'
    });
    try {
      await cancelReservationApi(reservationId);
      const existingReservation = reservations.value.find((item) => item.id === reservationId);
      const reservation: Reservation = existingReservation
        ? {
            ...existingReservation,
            status: 'cancelled',
            updatedAt: new Date().toISOString()
          }
        : {
            id: reservationId,
            restaurantId: String(context.restaurantId),
            date: formState.value.selectedDate,
            start: toIsoDatetime(formState.value.selectedDate, '00:00'),
            end: toIsoDatetime(formState.value.selectedDate, '00:00'),
            partySize: formState.value.partySize,
            status: 'cancelled',
            code: reservationId,
            shortToken: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
      upsertReservation(reservation);
      trackEvent('reservation_cancel_success', {
        restaurantId: context.restaurantId,
        reservationId
      });
      emitReservationAudit({
        type: 'reservation_cancel',
        restaurantId: context.restaurantId,
        reservationId,
        status: 'success'
      });
      return reservation;
    } catch (error) {
      const apiError = error as ApiError;
      trackEvent('reservation_cancel_error', {
        restaurantId: context.restaurantId,
        reservationId,
        errorCode: extractErrorCode(apiError)
      });
      emitReservationAudit({
        type: 'reservation_cancel',
        restaurantId: context.restaurantId,
        reservationId,
        status: 'error',
        errorCode: extractErrorCode(apiError)
      });
      throw error;
    } finally {
      formState.value.isSubmitting = false;
      isProcessingReservation.value = false;
    }
  };

  const selectSlot = (slotId?: string): void => {
    formState.value.selectedSlotId = slotId;
  };

  const resetFormState = (): void => {
    formState.value = {
      selectedDate: today(),
      partySize: 2,
      selectedSlotId: undefined,
      availability: availability.value,
      isSubmitting: false,
      businessError: undefined
    };
  };

  return {
    reservations,
    availability,
    tableBuckets,
    formState,
    selectedSlot,
    isLoadingAvailability,
    isLoadingReservations,
    isProcessingReservation,
    errorMessage,
    availabilityTimeout,
    availabilityPermissionDenied,
    lookupReservation,
    lookupError,
    lookupTimeout,
    lookupPermissionDenied,
    isLookingUpReservation,
    loadAvailability,
    loadAvailabilityDetail,
    loadMyReservations,
    lookupReservationByCode,
    lookupReservationByShortToken,
    resetLookupState,
    createReservation,
    modifyReservation,
    cancelReservation,
    selectSlot,
    resetFormState
  };
});
