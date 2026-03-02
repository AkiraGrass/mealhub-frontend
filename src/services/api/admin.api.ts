import { httpClient } from '@/services/http/client';
import type { ApiEnvelope } from '@/types/api';
import type { RestaurantDetail, RestaurantStatus } from '@/types/restaurant';
import type {
  AdminRole,
  AvailabilitySlot,
  Reservation,
  RestaurantAdmin,
  TableBucket
} from '@/types/reservation';

export interface AdminReservationsParams {
  date?: string;
  timeslot?: string;
}

interface AdminReservationApiItem {
  id: string | number;
  restaurantId?: string | number;
  restaurant_id?: string | number;
  date?: string;
  reserve_date?: string;
  start?: string;
  end?: string;
  slotId?: string;
  timeslot?: string;
  partySize?: number;
  party_size?: number;
  status?: string;
  code?: string;
  reservation_code?: string;
  shortToken?: string;
  short_token?: string;
  notes?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface AdminReservationsApiPayload {
  summary?: unknown[];
  items?: AdminReservationApiItem[];
}

const toIsoDatetime = (date: string, time: string): string => `${date}T${time}:00`;

const parseTimeslot = (timeslot: string | undefined): { start: string; end: string } => {
  if (!timeslot) {
    return { start: '00:00', end: '00:00' };
  }
  const [start = '00:00', end = '00:00'] = timeslot.split('-');
  return { start, end };
};

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

const mapAdminReservationItem = (
  item: AdminReservationApiItem,
  restaurantId: number | string
): Reservation => {
  const date = item.date ?? item.reserve_date ?? new Date().toISOString().slice(0, 10);
  const rawTimeslot = item.timeslot ?? item.slotId;
  const parsedSlot = parseTimeslot(rawTimeslot);
  const start = item.start
    ? item.start
    : toIsoDatetime(date, parsedSlot.start);
  const end = item.end
    ? item.end
    : toIsoDatetime(date, parsedSlot.end);

  return {
    id: String(item.id),
    restaurantId: String(item.restaurantId ?? item.restaurant_id ?? restaurantId),
    date,
    start,
    end,
    slotId: rawTimeslot || `${parsedSlot.start}-${parsedSlot.end}`,
    partySize: Number(item.partySize ?? item.party_size ?? 0),
    status: normalizeReservationStatus(item.status),
    code: item.code ?? item.reservation_code ?? String(item.id),
    shortToken: item.shortToken ?? item.short_token ?? '',
    notes: item.notes,
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.updated_at ?? new Date().toISOString()
  };
};

export const fetchAdminReservationsApi = async (
  restaurantId: number | string,
  params: AdminReservationsParams = {}
): Promise<Reservation[]> => {
  const response = await httpClient.get<ApiEnvelope<Reservation[] | AdminReservationsApiPayload>>(
    `/restaurants/${restaurantId}/reservations`,
    { params }
  );

  const payload = response.data.data;
  const items = Array.isArray(payload)
    ? payload
    : (payload?.items ?? []);

  return items.map((item) => mapAdminReservationItem(item as AdminReservationApiItem, restaurantId));
};

export interface UpdateRestaurantSettingsPayload {
  note?: string | null;
  status?: RestaurantStatus;
  tableBuckets?: TableBucket[];
  isAcceptingReservations?: boolean;
}

export const updateRestaurantSettingsApi = async (
  restaurantId: number | string,
  payload: UpdateRestaurantSettingsPayload
): Promise<RestaurantDetail> => {
  const response = await httpClient.patch<ApiEnvelope<RestaurantDetail>>(
    `/restaurants/${restaurantId}`,
    payload
  );
  return response.data.data as RestaurantDetail;
};

export interface TimeslotPayload {
  start: string;
  end: string;
  capacity: number;
  notes?: string;
}

export const createTimeslotApi = async (
  restaurantId: number | string,
  payload: TimeslotPayload
): Promise<AvailabilitySlot> => {
  const response = await httpClient.post<ApiEnvelope<AvailabilitySlot>>(
    `/restaurants/${restaurantId}/timeslots`,
    payload
  );
  return response.data.data as AvailabilitySlot;
};

export const updateTimeslotApi = async (
  restaurantId: number | string,
  slotId: string,
  payload: Partial<TimeslotPayload>
): Promise<AvailabilitySlot> => {
  const response = await httpClient.patch<ApiEnvelope<AvailabilitySlot>>(
    `/restaurants/${restaurantId}/timeslots/${slotId}`,
    payload
  );
  return response.data.data as AvailabilitySlot;
};

export const deleteTimeslotApi = async (
  restaurantId: number | string,
  slotId: string
): Promise<void> => {
  await httpClient.delete(`/restaurants/${restaurantId}/timeslots/${slotId}`);
};

export const fetchRestaurantAdminsApi = async (
  restaurantId: number | string
): Promise<RestaurantAdmin[]> => {
  const response = await httpClient.get<ApiEnvelope<RestaurantAdmin[]>>(
    `/restaurants/${restaurantId}/admins`
  );
  return (response.data.data ?? []) as RestaurantAdmin[];
};

export interface InviteRestaurantAdminPayload {
  name: string;
  email: string;
  role: AdminRole;
}

export const inviteRestaurantAdminApi = async (
  restaurantId: number | string,
  payload: InviteRestaurantAdminPayload
): Promise<RestaurantAdmin> => {
  const response = await httpClient.post<ApiEnvelope<RestaurantAdmin>>(
    `/restaurants/${restaurantId}/admins`,
    payload
  );
  return response.data.data as RestaurantAdmin;
};

export const removeRestaurantAdminApi = async (
  restaurantId: number | string,
  adminId: string
): Promise<void> => {
  await httpClient.delete(`/restaurants/${restaurantId}/admins/${adminId}`);
};

export const cancelAdminReservationApi = async (reservationId: string): Promise<boolean> => {
  const response = await httpClient.post<ApiEnvelope<{ cancelled: number }>>('/reservations/cancel', {
    reservationId
  });
  return Boolean(response.data.data?.cancelled);
};
