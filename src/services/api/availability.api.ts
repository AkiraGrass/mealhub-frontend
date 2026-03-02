import { httpClient } from '@/services/http/client';
import type { ApiEnvelope } from '@/types/api';
import type { AvailabilitySlot, TableBucket } from '@/types/reservation';

export interface AvailabilityParams {
  date: string;
  partySize?: number;
}

interface AvailabilityApiSlot {
  start: string;
  end: string;
  capacity: number;
  reserved: number;
  available: number;
}

interface AvailabilityDetailApiPartySize {
  size: number;
  available: number;
}

interface AvailabilityDetailApiSlot {
  start: string;
  end: string;
  byPartySize?: AvailabilityDetailApiPartySize[];
  totals?: {
    capacity: number;
    reserved: number;
    available: number;
  };
}

const toSlotId = (start: string, end: string): string => `${start}-${end}`;

const mapAvailabilitySlot = (slot: AvailabilityApiSlot): AvailabilitySlot => ({
  slotId: toSlotId(slot.start, slot.end),
  start: slot.start,
  end: slot.end,
  capacity: slot.capacity,
  reserved: slot.reserved,
  available: slot.available,
  byPartySize: []
});

export const fetchRestaurantAvailabilityApi = async (
  restaurantId: number | string,
  params: AvailabilityParams
): Promise<AvailabilitySlot[]> => {
  const response = await httpClient.get<ApiEnvelope<AvailabilityApiSlot[]>>(
    `/restaurants/${restaurantId}/availability`,
    {
      params
    }
  );

  const slots = response.data.data ?? [];
  return slots.map(mapAvailabilitySlot);
};

export interface AvailabilityDetailPayload {
  restaurantId: number | string;
  date: string;
}

export interface AvailabilityDetailResult {
  slots: AvailabilitySlot[];
  tableBuckets: TableBucket[];
}

export const fetchAvailabilityDetailApi = async (
  payload: AvailabilityDetailPayload
): Promise<AvailabilityDetailResult> => {
  const response = await httpClient.get<ApiEnvelope<AvailabilityDetailApiSlot[]>>(
    `/restaurants/${payload.restaurantId}/availability/detail`,
    {
    params: {
      date: payload.date
    }
    }
  );

  const slots = (response.data.data ?? []).map((slot) => ({
    slotId: toSlotId(slot.start, slot.end),
    start: slot.start,
    end: slot.end,
    capacity: slot.totals?.capacity ?? 0,
    reserved: slot.totals?.reserved ?? 0,
    available: slot.totals?.available ?? 0,
    byPartySize: (slot.byPartySize ?? []).map((item) => ({
      partySize: item.size,
      available: item.available
    }))
  }));

  return {
    slots,
    tableBuckets: [] as TableBucket[]
  };
};
