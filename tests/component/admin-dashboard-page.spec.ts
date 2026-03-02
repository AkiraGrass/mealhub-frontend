import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage.vue';
import { requireAuthGuard } from '@/router/guards';

type MockReservation = ReturnType<typeof createMockReservation>;

const createMockReservation = () => ({
  id: 'res-1',
  restaurantId: '1',
  date: '2025-01-01',
  start: '2025-01-01T18:00:00Z',
  end: '2025-01-01T19:00:00Z',
  partySize: 2,
  status: 'confirmed' as const,
  code: 'ABC',
  shortToken: 'XYZ',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  slotId: 'slot-1'
});

const createMockSlot = () => ({
  slotId: 'slot-1',
  start: '2025-01-01T18:00:00Z',
  end: '2025-01-01T19:00:00Z',
  capacity: 10,
  reserved: 4,
  available: 6,
  byPartySize: []
});

const createMockAdminScheduling = () => ({
  restaurantId: ref('1'),
  selectedDate: ref('2025-01-01'),
  selectedTimeslot: ref<string | null>(null),
  reservations: ref<MockReservation[]>([createMockReservation()]),
  slots: ref([createMockSlot()]),
  tableBuckets: ref([]),
  admins: ref([]),
  isLoadingDashboard: ref(false),
  dashboardError: ref<string | null>(null),
  permissionDenied: ref(false),
  dashboardTimeout: ref(false),
  isSavingTimeslot: ref(false),
  isSavingBuckets: ref(false),
  isSavingMembers: ref(false),
  isCancellingReservation: ref(false),
  mutationErrorCode: ref<string | null>(null),
  hasActiveAdmin: ref(true),
  dashboardEmpty: ref(false),
  loadDashboard: vi.fn(),
  refreshAdmins: vi.fn(),
  saveTimeslot: vi.fn(),
  removeTimeslot: vi.fn(),
  saveTableBuckets: vi.fn(),
  inviteAdmin: vi.fn(),
  removeAdmin: vi.fn(),
  cancelReservation: vi.fn(),
  updateRestaurantSettings: vi.fn(),
  clearMutationError: vi.fn()
});

let mockAdminScheduling = createMockAdminScheduling();
let mockAuthStore = { isAuthenticated: true };
let mockAdminGuardStore = { refreshAdmins: vi.fn() };

vi.mock('@/composables/useAdminScheduling', () => ({
  useAdminScheduling: () => mockAdminScheduling
}));

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore
}));

vi.mock('@/stores/admin.store', () => ({
  useAdminStore: () => mockAdminGuardStore
}));

const createTestRouter = (): Router =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/restaurants', name: 'restaurants-list', component: { template: '<div />' } },
      { path: '/admin/:restaurantId', name: 'admin-dashboard', component: AdminDashboardPage }
    ]
  });

beforeEach(() => {
  mockAdminScheduling = createMockAdminScheduling();
  mockAuthStore = { isAuthenticated: true };
  mockAdminGuardStore = {
    refreshAdmins: vi.fn().mockResolvedValue(undefined)
  };
});

describe('AdminDashboardPage', () => {
  it('renders summary cards and loads dashboard on mount', async () => {
    const router = createTestRouter();
    await router.push('/admin/42');
    await router.isReady();

    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(AdminDashboardPage, {
      global: {
        plugins: [pinia, router]
      }
    });
    await flushPromises();

    expect(mockAdminScheduling.loadDashboard).toHaveBeenCalledWith(
      '42',
      { date: '2025-01-01' },
      { force: undefined }
    );
    expect(wrapper.text()).toContain('每日概覽');
  });

  it('shows permission denied state when store flag is set', async () => {
    mockAdminScheduling.permissionDenied.value = true;
    mockAdminScheduling.dashboardError.value = null;

    const router = createTestRouter();
    await router.push('/admin/1');
    await router.isReady();

    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(AdminDashboardPage, {
      global: {
        plugins: [pinia, router]
      }
    });
    await flushPromises();

    expect(wrapper.text()).toContain('需要重新登入');
  });

  it('keeps cancel action enabled when admin management is disabled but permission is valid', async () => {
    mockAdminScheduling.hasActiveAdmin.value = false;
    mockAdminScheduling.permissionDenied.value = false;

    const router = createTestRouter();
    await router.push('/admin/1');
    await router.isReady();

    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(AdminDashboardPage, {
      global: {
        plugins: [pinia, router]
      }
    });
    await flushPromises();

    const reservationsTable = wrapper.findComponent({ name: 'AdminReservationsTable' });
    expect(reservationsTable.exists()).toBe(true);
    expect(reservationsTable.props('canCancel')).toBe(true);
  });
});

describe('requireAuthGuard', () => {
  it('redirects to login when route requires auth and user is not authenticated', async () => {
    mockAuthStore.isAuthenticated = false;
    const next = vi.fn();
    const to = {
      matched: [{ meta: { requiresAuth: true } }],
      fullPath: '/admin/9',
      params: {},
      query: {}
    } as unknown as Parameters<typeof requireAuthGuard>[0];

    await requireAuthGuard(to, to, next);

    expect(next).toHaveBeenCalledWith({
      name: 'login',
      query: { reason: 'unauthorized', redirect: '/admin/9' }
    });
  });

  it('redirects to permission screen on admin 403', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAdminGuardStore.refreshAdmins.mockRejectedValue({ response: { status: 403 } });
    const next = vi.fn();
    const to = {
      matched: [{ meta: { requiresAuth: true, requiresAdmin: true } }],
      fullPath: '/admin/5',
      params: { restaurantId: '5' },
      query: {}
    } as unknown as Parameters<typeof requireAuthGuard>[0];

    await requireAuthGuard(to, to, next);

    expect(mockAdminGuardStore.refreshAdmins).toHaveBeenCalledWith('5');
    expect(next).toHaveBeenCalledWith({ name: 'permission-denied', query: { from: '/admin/5' } });
  });
});
