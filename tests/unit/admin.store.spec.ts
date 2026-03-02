import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAdminStore } from '@/stores/admin.store';
import {
  cancelAdminReservationApi,
  createTimeslotApi,
  fetchAdminReservationsApi,
  fetchRestaurantAdminsApi,
  inviteRestaurantAdminApi,
  removeRestaurantAdminApi,
  updateRestaurantSettingsApi,
  updateTimeslotApi
} from '@/services/api/admin.api';
import { fetchAvailabilityDetailApi } from '@/services/api/availability.api';

vi.mock('@/utils/telemetry', () => ({
  trackEvent: vi.fn()
}));

vi.mock('@/services/api/admin.api', () => ({
  cancelAdminReservationApi: vi.fn(),
  fetchAdminReservationsApi: vi.fn(),
  fetchRestaurantAdminsApi: vi.fn(),
  createTimeslotApi: vi.fn(),
  deleteTimeslotApi: vi.fn(),
  inviteRestaurantAdminApi: vi.fn(),
  removeRestaurantAdminApi: vi.fn(),
  updateTimeslotApi: vi.fn(),
  updateRestaurantSettingsApi: vi.fn()
}));

vi.mock('@/services/api/availability.api', () => ({
  fetchAvailabilityDetailApi: vi.fn()
}));

const reservationsMock = vi.mocked(fetchAdminReservationsApi);
const cancelReservationMock = vi.mocked(cancelAdminReservationApi);
const availabilityMock = vi.mocked(fetchAvailabilityDetailApi);
const adminsMock = vi.mocked(fetchRestaurantAdminsApi);
const createTimeslotMock = vi.mocked(createTimeslotApi);
const updateTimeslotMock = vi.mocked(updateTimeslotApi);
const updateSettingsMock = vi.mocked(updateRestaurantSettingsApi);
const inviteAdminMock = vi.mocked(inviteRestaurantAdminApi);
const removeAdminMock = vi.mocked(removeRestaurantAdminApi);

describe('admin.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads dashboard data and caches results', async () => {
    reservationsMock.mockResolvedValue([
      {
        id: 'r-1',
        restaurantId: '1',
        date: '2025-01-01',
        start: '2025-01-01T18:00:00Z',
        end: '2025-01-01T19:00:00Z',
        partySize: 2,
        status: 'confirmed',
        code: 'ABC',
        shortToken: 'XYZ',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slotId: 'slot-1'
      }
    ]);
    availabilityMock.mockResolvedValue({
      slots: [
        {
          slotId: 'slot-1',
          start: '2025-01-01T18:00:00Z',
          end: '2025-01-01T19:00:00Z',
          capacity: 10,
          reserved: 4,
          available: 6,
          byPartySize: []
        }
      ],
      tableBuckets: []
    });

    const store = useAdminStore();
    await store.loadDashboard(1, { date: '2025-01-01' });
    expect(store.reservations).toHaveLength(1);
    expect(reservationsMock).toHaveBeenCalledTimes(1);

    await store.loadDashboard(1, { date: '2025-01-01' });
    expect(reservationsMock).toHaveBeenCalledTimes(1);
    expect(store.dashboardError).toBeNull();
  });

  it('does not crash when reservation payload is non-array', async () => {
    reservationsMock.mockResolvedValue({ items: [] } as unknown as never);
    availabilityMock.mockResolvedValue({ slots: [], tableBuckets: [] });

    const store = useAdminStore();
    await store.loadDashboard(1, { date: '2025-01-01' });

    expect(store.reservations).toEqual([]);
    expect(store.dashboardError).toBeNull();
  });

  it('flags permission denied when API returns 403', async () => {
    reservationsMock.mockRejectedValue({
      response: { status: 403 },
      message: 'forbidden'
    });
    availabilityMock.mockResolvedValue({ slots: [], tableBuckets: [] });

    const store = useAdminStore();
    await store.loadDashboard(1, { date: '2025-01-01' });

    expect(store.permissionDenied).toBe(true);
    expect(store.dashboardError).toContain('forbidden');
  });

  it('refreshes admins and sets active flag', async () => {
    adminsMock.mockResolvedValue([
      {
        id: 'admin-1',
        restaurantId: '1',
        userId: 'user-1',
        name: 'Owner',
        email: 'owner@example.com',
        role: 'owner',
        status: 'active'
      }
    ]);

    const store = useAdminStore();
    await store.refreshAdmins(1);

    expect(store.admins).toHaveLength(1);
    expect(store.hasActiveAdmin).toBe(true);
  });

  it('allows admin to cancel reservation', async () => {
    const store = useAdminStore();
    store.restaurantId = 1;
    store.reservations = [
      {
        id: 'r-1',
        restaurantId: '1',
        date: '2025-01-01',
        start: '2025-01-01T18:00:00Z',
        end: '2025-01-01T19:00:00Z',
        partySize: 2,
        status: 'confirmed',
        code: 'ABC',
        shortToken: 'XYZ',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slotId: 'slot-1'
      }
    ];
    cancelReservationMock.mockResolvedValue(true);

    await store.cancelReservation('r-1');

    expect(cancelReservationMock).toHaveBeenCalledWith('r-1');
    expect(store.reservations[0].status).toBe('cancelled');
  });

  it('rolls back optimistic timeslot update on 409 conflict', async () => {
    const store = useAdminStore();
    store.restaurantId = 1;
    store.slots = [
      {
        slotId: 'slot-1',
        start: '2025-01-01T18:00:00Z',
        end: '2025-01-01T19:00:00Z',
        capacity: 10,
        reserved: 2,
        available: 8,
        byPartySize: []
      }
    ];

    updateTimeslotMock.mockRejectedValue({
      response: { status: 409, data: { message: 'cannotModifyTimeslotActive' } },
      message: 'conflict'
    });

    await expect(
      store.saveTimeslot({
        slotId: 'slot-1',
        start: '2025-01-01T18:30:00Z',
        end: '2025-01-01T19:30:00Z',
        capacity: 8
      })
    ).rejects.toBeTruthy();

    expect(store.slots[0].start).toBe('2025-01-01T18:00:00Z');
    expect(store.mutationErrorCode).toBe('cannotModifyTimeslotActive');
  });

  it('updates timeslot when mutation succeeds', async () => {
    const store = useAdminStore();
    store.restaurantId = 1;
    store.selectedDate = '2025-01-01';
    store.slots = [];
    store.reservations = [];
    store.tableBuckets = [];

    createTimeslotMock.mockResolvedValue({
      slotId: 'slot-9',
      start: '2025-01-01T20:00:00Z',
      end: '2025-01-01T21:00:00Z',
      capacity: 12,
      reserved: 0,
      available: 12,
      byPartySize: []
    });
    reservationsMock.mockResolvedValue([]);
    availabilityMock.mockResolvedValue({ slots: [], tableBuckets: [] });

    await store.saveTimeslot({
      start: '2025-01-01T20:00:00Z',
      end: '2025-01-01T21:00:00Z',
      capacity: 12
    });

    expect(createTimeslotMock).toHaveBeenCalledTimes(1);
    expect(store.mutationErrorCode).toBeNull();
  });

  it('rolls back table buckets on 409 conflict', async () => {
    const store = useAdminStore();
    store.restaurantId = 1;
    store.tableBuckets = [
      { bucketId: 'b-1', size: 2, capacity: 8, reserved: 2, available: 6 }
    ];

    updateSettingsMock.mockRejectedValue({
      response: { status: 409, data: { message: 'cannotModifyTimeslotsActive' } },
      message: 'conflict'
    });

    await expect(
      store.saveTableBuckets([
        { bucketId: 'b-1', size: 2, capacity: 4, reserved: 2, available: 2 }
      ])
    ).rejects.toBeTruthy();

    expect(store.tableBuckets[0].capacity).toBe(8);
    expect(store.mutationErrorCode).toBe('cannotModifyTimeslotsActive');
  });

  it('prevents deleting the last active admin', async () => {
    const store = useAdminStore();
    store.restaurantId = 1;
    store.admins = [
      {
        id: 'admin-1',
        restaurantId: '1',
        userId: 'user-1',
        name: 'Owner',
        email: 'owner@example.com',
        role: 'owner',
        status: 'active'
      }
    ];

    await expect(store.removeAdmin('admin-1')).rejects.toThrow('atLeastOneActiveAdminRequired');
    expect(removeAdminMock).not.toHaveBeenCalled();
    expect(store.mutationErrorCode).toBe('atLeastOneActiveAdminRequired');
  });

  it('rolls back invited admin on invite failure', async () => {
    const store = useAdminStore();
    store.restaurantId = 1;
    store.admins = [
      {
        id: 'admin-1',
        restaurantId: '1',
        userId: 'user-1',
        name: 'Owner',
        email: 'owner@example.com',
        role: 'owner',
        status: 'active'
      }
    ];

    inviteAdminMock.mockRejectedValue({
      response: { status: 409, data: { message: 'conflict' } },
      message: 'conflict'
    });

    await expect(
      store.inviteAdmin({
        name: 'Operator',
        email: 'operator@example.com',
        role: 'operator'
      })
    ).rejects.toBeTruthy();

    expect(store.admins).toHaveLength(1);
    expect(store.admins[0].id).toBe('admin-1');
    expect(store.mutationErrorCode).toBe('conflict');
  });
});
