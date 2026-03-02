import type { ReservationAuditEvent } from '@/types/reservation';

export type TelemetryEvent =
  | 'auth_login_success'
  | 'auth_login_failure'
  | 'auth_register_success'
  | 'auth_register_failure'
  | 'auth_logout'
  | 'restaurants_list_success'
  | 'restaurants_list_failure'
  | 'restaurants_detail_success'
  | 'restaurants_detail_failure'
  | 'restaurants_image_load_failure'
  | 'restaurants_permission_denied'
  | 'restaurants_timeout'
  | 'restaurants_image_mapping_missing'
  | 'asset_fallback_shown'
  | 'reservation_action_start'
  | 'reservation_lookup_success'
  | 'reservation_lookup_timeout'
  | 'reservation_lookup_permission_denied'
  | 'reservation_create_success'
  | 'reservation_create_error'
  | 'reservation_modify_success'
  | 'reservation_modify_error'
  | 'reservation_cancel_success'
  | 'reservation_cancel_error'
  | 'reservation_my_list_success'
  | 'reservation_my_list_error'
  | 'admin_dashboard_load_success'
  | 'admin_dashboard_load_timeout'
  | 'admin_dashboard_load_permission_denied'
  | 'admin_timeslot_update_success'
  | 'admin_timeslot_update_error'
  | 'admin_bucket_update_success'
  | 'admin_bucket_update_error'
  | 'admin_member_update_success'
  | 'admin_member_update_error';

export type TelemetryListener = (event: TelemetryEvent, payload: Record<string, unknown>) => void;

const listeners: TelemetryListener[] = [];
type ReservationAuditListener = (payload: ReservationAuditEvent) => void;
const reservationAuditListeners: ReservationAuditListener[] = [];

export const addTelemetryListener = (listener: TelemetryListener): (() => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  };
};

const dispatchToListeners = (event: TelemetryEvent, payload: Record<string, unknown>): void => {
  listeners.forEach((listener) => {
    try {
      listener(event, payload);
    } catch (error) {
      console.warn('[telemetry] listener error', { event, error });
    }
  });
};

export const trackEvent = (event: TelemetryEvent, payload: Record<string, unknown> = {}): void => {
  const enrichedPayload = {
    ...payload,
    timestamp: new Date().toISOString()
  };
  dispatchToListeners(event, enrichedPayload);
  console.info('[telemetry]', event, enrichedPayload);
};

export const addReservationAuditListener = (listener: ReservationAuditListener): (() => void) => {
  reservationAuditListeners.push(listener);
  return () => {
    const index = reservationAuditListeners.indexOf(listener);
    if (index >= 0) {
      reservationAuditListeners.splice(index, 1);
    }
  };
};

const dispatchReservationAudit = (payload: ReservationAuditEvent): void => {
  reservationAuditListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (error) {
      console.warn('[telemetry] reservation audit listener error', { error });
    }
  });
};

export const trackReservationAudit = (payload: ReservationAuditEvent): void => {
  dispatchReservationAudit(payload);
  console.info('[reservation-audit]', payload.type, payload);
};
