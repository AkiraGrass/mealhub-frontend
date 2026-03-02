import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useReservationsStore } from '@/stores/reservations.store';
import { fetchRestaurantAvailabilityApi } from '@/services/api/availability.api';
import {
  createReservationApi,
  fetchMyReservationsApi,
  fetchReservationByCodeApi,
  fetchReservationByShortTokenApi,
  updateReservationApi
} from '@/services/api/reservations.api';

const trackReservationAudit = vi.fn();
const trackEvent = vi.fn();

vi.mock('@/utils/telemetry', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
  trackReservationAudit: (...args: unknown[]) => trackReservationAudit(...args)
}));

vi.mock('@/services/api/availability.api', () => ({
  fetchRestaurantAvailabilityApi: vi.fn(),
  fetchAvailabilityDetailApi: vi.fn()
}));

vi.mock('@/services/api/reservations.api', () => ({
  createReservationApi: vi.fn(),
  updateReservationApi: vi.fn(),
  cancelReservationApi: vi.fn(),
  fetchMyReservationsApi: vi.fn(),
  fetchReservationByCodeApi: vi.fn(),
  fetchReservationByShortTokenApi: vi.fn()
}));

describe('reservations.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    trackReservationAudit.mockClear();
    trackEvent.mockClear();
  });

  it('loads availability and resets flags on success', async () => {
    const mockedFetchAvailability = vi.mocked(fetchRestaurantAvailabilityApi);
    mockedFetchAvailability.mockResolvedValue([
      {
        slotId: 'slot-1',
        start: '18:00',
        end: '20:00',
        capacity: 10,
        reserved: 4,
        available: 6,
        byPartySize: []
      }
    ]);

    const store = useReservationsStore();
    await store.loadAvailability(1, '2025-01-01', 2);

    expect(store.availability).toHaveLength(1);
    expect(store.errorMessage).toBeNull();
    expect(store.availabilityTimeout).toBe(false);
    expect(store.availabilityPermissionDenied).toBe(false);
  });

  it('flags permission denied when availability API returns 403', async () => {
    const mockedFetchAvailability = vi.mocked(fetchRestaurantAvailabilityApi);
    mockedFetchAvailability.mockRejectedValue({
      response: { status: 403 },
      userMessage: 'forbidden'
    });

    const store = useReservationsStore();
    await expect(store.loadAvailability(2, '2025-01-02', 4)).rejects.toBeDefined();
    expect(store.availabilityPermissionDenied).toBe(true);
    expect(store.errorMessage).toMatch('forbidden');
  });

  it('creates reservation and stores it on success', async () => {
    const mockedCreateReservation = vi.mocked(createReservationApi);
    mockedCreateReservation.mockResolvedValue({
      code: 'ABC123',
      shortToken: 'XYZ'
    });

    const store = useReservationsStore();
    store.availability = [
      {
        slotId: 'slot-1',
        start: '18:00',
        end: '20:00',
        capacity: 10,
        reserved: 4,
        available: 6,
        byPartySize: []
      }
    ];
    const result = await store.createReservation({
      restaurantId: 1,
      slotId: 'slot-1',
      date: '2025-01-01',
      partySize: 2,
      contact: { name: 'Tester', phone: '0912', email: 'tester@example.com' }
    });

    expect(result.code).toBe('ABC123');
    expect(result.shortToken).toBe('XYZ');
    expect(store.reservations[0].start).toContain('2025-01-01T18:00:00');
    expect(store.formState.isSubmitting).toBe(false);
    expect(trackReservationAudit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'reservation_create', status: 'success' })
    );
  });

  it('sets business error when reservation API returns sold out', async () => {
    const mockedCreateReservation = vi.mocked(createReservationApi);
    mockedCreateReservation.mockRejectedValue({
      response: { data: { message: 'sold_out' } }
    });

    const store = useReservationsStore();
    await expect(
      store.createReservation({
        restaurantId: 1,
        slotId: 'slot-2',
        date: '2025-01-01',
        partySize: 2,
        contact: { name: 'Tester', phone: '0912', email: 'tester@example.com' }
      })
    ).rejects.toBeDefined();

    expect(store.formState.businessError).toBe('sold_out');
    expect(trackReservationAudit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'reservation_create', status: 'error', errorCode: 'sold_out' })
    );
  });

  it('loads my reservations from API', async () => {
    const mockedFetchMyReservations = vi.mocked(fetchMyReservationsApi);
    mockedFetchMyReservations.mockResolvedValue([
      {
        id: 'r-2',
        restaurantId: '1',
        date: '2025-02-01',
        start: '2025-02-01T18:00:00Z',
        end: '2025-02-01T20:00:00Z',
        partySize: 4,
        status: 'confirmed',
        code: 'XYZ999',
        shortToken: 'TT11',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);

    const store = useReservationsStore();
    await store.loadMyReservations();

    expect(store.reservations).toHaveLength(1);
  });

  it('prevents modifying cancelled reservation', async () => {
    const mockedUpdateReservation = vi.mocked(updateReservationApi);
    const store = useReservationsStore();
    store.reservations = [
      {
        id: 'r-cancelled',
        restaurantId: '1',
        date: '2025-02-01',
        start: '2025-02-01T18:00:00Z',
        end: '2025-02-01T20:00:00Z',
        partySize: 4,
        status: 'cancelled',
        code: 'XYZ999',
        shortToken: 'TT11',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    await expect(
      store.modifyReservation('r-cancelled', {
        restaurantId: '1',
        slotId: 'slot-2'
      })
    ).rejects.toThrow('此訂位已取消');

    expect(mockedUpdateReservation).not.toHaveBeenCalled();
  });

  it('looks up reservation by code and stores result', async () => {
    const mockedLookup = vi.mocked(fetchReservationByCodeApi);
    const lookupReservation = {
      id: 'r-3',
      restaurantId: '2',
      date: '2025-03-01',
      start: '2025-03-01T12:00:00Z',
      end: '2025-03-01T13:00:00Z',
      partySize: 2,
      status: 'confirmed' as const,
      code: 'CODE123',
      shortToken: 'AB12',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockedLookup.mockResolvedValue(lookupReservation);

    const store = useReservationsStore();
    const result = await store.lookupReservationByCode('CODE123');

    expect(result).toEqual(lookupReservation);
    expect(store.lookupReservation).toEqual(lookupReservation);
  });

  it('handles permission denied when looking up by short token', async () => {
    const mockedLookup = vi.mocked(fetchReservationByShortTokenApi);
    mockedLookup.mockRejectedValue({ response: { status: 403 }, message: 'forbidden' });

    const store = useReservationsStore();
    await expect(store.lookupReservationByShortToken('ZX9K')).rejects.toBeDefined();
    expect(store.lookupPermissionDenied).toBe(true);
  });
});
