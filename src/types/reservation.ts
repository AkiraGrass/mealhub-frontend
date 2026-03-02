export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'sold_out' | 'modified';

export interface Reservation {
  id: string;
  restaurantId: string;
  date: string;
  start: string;
  end: string;
  slotId?: string;
  partySize: number;
  status: ReservationStatus;
  code: string;
  shortToken: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityByPartySize {
  partySize: number;
  available: number;
}

export interface AvailabilitySlot {
  slotId: string;
  start: string;
  end: string;
  capacity: number;
  reserved: number;
  available: number;
  byPartySize: AvailabilityByPartySize[];
  notes?: string;
}

export interface TableBucket {
  bucketId: string;
  size: number;
  capacity: number;
  reserved: number;
  available: number;
}

export type AdminRole = 'owner' | 'operator';
export type AdminStatus = 'active' | 'invited' | 'revoked';

export interface RestaurantAdmin {
  id: string;
  restaurantId: string;
  userId: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
}

export type ReservationBusinessError =
  | 'sold_out'
  | 'already_reserved_this_restaurant'
  | 'no_capacity_for_party_size'
  | 'cannotModifyTimeslotActive'
  | 'cannotModifyTimeslotsActive';

export interface ReservationFormState {
  selectedDate: string;
  partySize: number;
  selectedSlotId?: string;
  availability: AvailabilitySlot[];
  isSubmitting: boolean;
  businessError?: ReservationBusinessError;
}

export type ReservationAuditEventType =
  | 'reservation_create'
  | 'reservation_cancel'
  | 'reservation_modify'
  | 'admin_timeslot_update'
  | 'admin_table_bucket_update'
  | 'admin_member_update';

export type ReservationAuditActorRole = 'customer' | 'admin';

export interface ReservationAuditEvent {
  eventId: string;
  type: ReservationAuditEventType;
  actorRole: ReservationAuditActorRole;
  actorId: string;
  reservationId?: string;
  restaurantId: string;
  status: 'success' | 'error';
  errorCode?: ReservationBusinessError | string;
  timestamp: string;
}
