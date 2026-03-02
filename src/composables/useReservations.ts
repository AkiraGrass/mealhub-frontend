import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useReservationsStore } from '@/stores/reservations.store';
import type { AvailabilityParams } from '@/services/api/availability.api';
import type {
  CreateReservationPayload,
  UpdateReservationPayload
} from '@/services/api/reservations.api';
import type { Reservation } from '@/types/reservation';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const assertDate = (value: string, field = 'date'): void => {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`${field} must be formatted as YYYY-MM-DD`);
  }
};

const assertPositive = (value: number, field: string): void => {
  if (value <= 0) {
    throw new Error(`${field} must be greater than zero`);
  }
};

const assertRestaurantId = (value: number | string): void => {
  if (value === undefined || value === null || value === '') {
    throw new Error('restaurantId is required');
  }
};

const assertNonEmpty = (value: string | undefined, field: string): void => {
  if (value && value.trim().length === 0) {
    throw new Error(`${field} must not be empty`);
  }
};

const assertRequired = (value: string, field: string): void => {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
};

export const useReservations = () => {
  const store = useReservationsStore();
  const {
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
    isLookingUpReservation
  } = storeToRefs(store);

  const canSubmit = computed(() => Boolean(formState.value.selectedSlotId) && !formState.value.isSubmitting);

  const loadAvailability = async (
    payload: AvailabilityParams & { restaurantId: number | string }
  ): Promise<void> => {
    assertRestaurantId(payload.restaurantId);
    assertDate(payload.date);
    const partySize = payload.partySize ?? formState.value.partySize ?? 2;
    assertPositive(partySize, 'partySize');
    await store.loadAvailability(payload.restaurantId, payload.date, partySize);
  };

  const loadAvailabilityDetail = async (
    payload: { restaurantId: number | string; date: string }
  ): Promise<void> => {
    assertRestaurantId(payload.restaurantId);
    assertDate(payload.date);
    await store.loadAvailabilityDetail(payload.restaurantId, payload.date);
  };

  const loadMyReservations = async (): Promise<void> => {
    await store.loadMyReservations();
  };

  const createReservation = async (payload: CreateReservationPayload): Promise<Reservation> => {
    assertRestaurantId(payload.restaurantId);
    assertDate(payload.date);
    assertPositive(payload.partySize, 'partySize');
    return store.createReservation(payload);
  };

  const modifyReservation = async (
    reservationId: string,
    payload: UpdateReservationPayload & { restaurantId: number | string }
  ): Promise<Reservation> => {
    assertRestaurantId(payload.restaurantId);
    assertNonEmpty(payload.slotId, 'slotId');
    return store.modifyReservation(reservationId, payload);
  };

  const cancelReservation = async (
    reservationId: string,
    context: { restaurantId: number | string }
  ): Promise<Reservation> => {
    assertRestaurantId(context.restaurantId);
    return store.cancelReservation(reservationId, context);
  };

  const lookupReservationByCode = async (code: string): Promise<Reservation> => {
    assertRequired(code, 'code');
    return store.lookupReservationByCode(code);
  };

  const lookupReservationByShortToken = async (token: string): Promise<Reservation> => {
    assertRequired(token, 'token');
    return store.lookupReservationByShortToken(token);
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
    canSubmit,
    loadAvailability,
    loadAvailabilityDetail,
    loadMyReservations,
    createReservation,
    modifyReservation,
    cancelReservation,
    lookupReservationByCode,
    lookupReservationByShortToken,
    resetLookupState: store.resetLookupState,
    selectSlot: store.selectSlot,
    resetFormState: store.resetFormState
  };
};
