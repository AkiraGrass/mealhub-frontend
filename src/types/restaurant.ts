import type { AvailabilitySlot, TableBucket } from './reservation';

export type RestaurantStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED';

export interface RestaurantSummary {
  id: number;
  name: string;
  description: string | null;
  address: string;
  status: RestaurantStatus;
  cuisineType: string;
}

export interface RestaurantDetail extends RestaurantSummary {
  note: string | null;
  timeslots: AvailabilitySlot[];
  tableBuckets: TableBucket[];
}
