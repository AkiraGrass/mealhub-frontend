import { httpClient } from '@/services/http/client';
import type { ApiEnvelope } from '@/types/api';
import type { Reservation } from '@/types/reservation';

export interface ReservationContactPayload {
  name: string;
  phone: string;
  email: string;
}

export interface CreateReservationPayload {
  restaurantId: string | number;
  slotId: string;
  date: string;
  partySize: number;
  contact: ReservationContactPayload;
  notes?: string;
}

export interface CreateReservationResult {
  code: string;
  shortToken: string;
}

const parseTimeslot = (slotId: string): { start: string; end: string } => {
  const [start, end] = slotId.split('-');
  if (!start || !end) {
    throw new Error('Invalid slotId format');
  }
  return { start, end };
};

const toIsoDatetime = (date: string, time: string): string => `${date}T${time}:00`;

const normalizeReservationStatus = (status: string | undefined): Reservation['status'] => {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'cancelled') {
    return 'cancelled';
  }
  if (normalized === 'sold_out') {
    return 'sold_out';
  }
  if (normalized === 'modified') {
    return 'modified';
  }
  if (normalized === 'pending') {
    return 'pending';
  }
  return 'confirmed';
};

const mapReservationRecord = (item: {
  id: string | number;
  restaurantId: string | number;
  date: string;
  timeslot?: string;
  partySize: number;
  status?: string;
  code?: string;
  shortToken?: string;
}): Reservation => {
  const slot = item.timeslot ?? '';
  const [startText = '00:00', endText = '00:00'] = slot.split('-');
  return {
    id: String(item.id),
    restaurantId: String(item.restaurantId),
    date: item.date,
    start: toIsoDatetime(item.date, startText),
    end: toIsoDatetime(item.date, endText),
    slotId: slot || undefined,
    partySize: item.partySize,
    status: normalizeReservationStatus(item.status),
    code: item.code ?? '',
    shortToken: item.shortToken ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const createReservationApi = async (
  payload: CreateReservationPayload
): Promise<CreateReservationResult> => {
  const { start, end } = parseTimeslot(payload.slotId);
  const response = await httpClient.post<ApiEnvelope<CreateReservationResult>>('/reservations', {
    restaurantId: payload.restaurantId,
    date: payload.date,
    start,
    end,
    partySize: payload.partySize,
    guestEmails: payload.contact.email ? [payload.contact.email] : []
  });
  const result = response.data.data;
  if (!result?.code || !result?.shortToken) {
    throw new Error('Reservation payload missing from response');
  }
  return result;
};

export interface UpdateReservationPayload {
  slotId?: string;
  partySize?: number;
  notes?: string;
}

export const updateReservationApi = async (
  reservationId: string,
  payload: UpdateReservationPayload
): Promise<Reservation> => {
  if (!payload.slotId) {
    throw new Error('slotId is required');
  }
  const { start, end } = parseTimeslot(payload.slotId);
  const response = await httpClient.patch<ApiEnvelope<unknown>>('/reservations', {
    reservationId,
    start,
    end
  });
  const data = response.data.data as
    | {
        id: string | number;
        restaurantId: string | number;
        date: string;
        timeslot: string;
        partySize: number;
        status?: string;
        code?: string;
        shortToken?: string;
      }
    | null;
  if (!data) {
    throw new Error('Reservation payload missing from response');
  }
  return mapReservationRecord(data);
};

export const cancelReservationApi = async (reservationId: string): Promise<boolean> => {
  const response = await httpClient.post<ApiEnvelope<{ cancelled: number }>>('/reservations/cancel', {
    reservationId
  });
  return Boolean(response.data.data?.cancelled);
};

export const fetchMyReservationsApi = async (): Promise<Reservation[]> => {
  const response = await httpClient.get<
    ApiEnvelope<
      Array<{
        id: string | number;
        restaurantId: string | number;
        date: string;
        timeslot: string;
        partySize: number;
        status?: string;
      }>
    >
  >('/reservations/my');
  return (response.data.data ?? []).map((item) =>
    mapReservationRecord({
      ...item,
      code: '',
      shortToken: ''
    })
  );
};

export const fetchReservationByCodeApi = async (code: string): Promise<Reservation> => {
  const response = await httpClient.get<
    ApiEnvelope<{
      id: string | number;
      restaurantId: string | number;
      date: string;
      timeslot: string;
      partySize: number;
      status?: string;
      code?: string;
      shortToken?: string;
    }>
  >(`/reservations/code/${encodeURIComponent(code)}`);
  const data = response.data.data;
  if (!data) {
    throw new Error('Reservation payload missing from response');
  }
  return mapReservationRecord(data);
};

export const fetchReservationByShortTokenApi = async (token: string): Promise<Reservation> => {
  const response = await httpClient.get<
    ApiEnvelope<{
      id: string | number;
      restaurantId: string | number;
      date: string;
      timeslot: string;
      partySize: number;
      status?: string;
      code?: string;
      shortToken?: string;
    }>
  >(`/reservations/short/${encodeURIComponent(token)}`);
  const data = response.data.data;
  if (!data) {
    throw new Error('Reservation payload missing from response');
  }
  return mapReservationRecord(data);
};
