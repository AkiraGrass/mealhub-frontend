import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage.vue';

const createMockAdminScheduling = () => ({
  restaurantId: ref('1'),
  selectedDate: ref('2025-01-01'),
  selectedTimeslot: ref<string | null>(null),
  reservations: ref([]),
  slots: ref([]),
  tableBuckets: ref([]),
  admins: ref([
    {
      id: 'admin-1',
      restaurantId: '1',
      userId: 'user-1',
      name: 'Owner',
      email: 'owner@example.com',
      role: 'owner' as const,
      status: 'active' as const
    }
  ]),
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
  saveTimeslot: vi.fn().mockResolvedValue(undefined),
  removeTimeslot: vi.fn().mockResolvedValue(undefined),
  saveTableBuckets: vi.fn().mockResolvedValue(undefined),
  inviteAdmin: vi.fn().mockResolvedValue(undefined),
  removeAdmin: vi.fn().mockResolvedValue(undefined),
  cancelReservation: vi.fn().mockResolvedValue(undefined),
  updateRestaurantSettings: vi.fn().mockResolvedValue(undefined),
  clearMutationError: vi.fn()
});

let mockAdminScheduling = createMockAdminScheduling();

vi.mock('@/composables/useAdminScheduling', () => ({
  useAdminScheduling: () => mockAdminScheduling
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

const mountPage = async (): Promise<ReturnType<typeof mount>> => {
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
  return wrapper;
};

beforeEach(() => {
  mockAdminScheduling = createMockAdminScheduling();
});

describe('Admin management integration', () => {
  it('forwards editor actions to admin composable mutations', async () => {
    const wrapper = await mountPage();

    const timeslotEditor = wrapper.findComponent({ name: 'TimeslotEditorDrawer' });
    const bucketEditor = wrapper.findComponent({ name: 'TableBucketEditor' });
    const membersPanel = wrapper.findComponent({ name: 'AdminMembersPanel' });

    expect(timeslotEditor.exists()).toBe(true);
    expect(bucketEditor.exists()).toBe(true);
    expect(membersPanel.exists()).toBe(true);

    timeslotEditor.vm.$emit('save', {
      start: '2025-01-01T18:00:00Z',
      end: '2025-01-01T19:00:00Z',
      capacity: 6
    });
    bucketEditor.vm.$emit('save', [
      { bucketId: 'b-1', size: 2, capacity: 8, reserved: 0, available: 8 }
    ]);
    membersPanel.vm.$emit('invite', {
      name: 'Operator',
      email: 'operator@example.com',
      role: 'operator'
    });
    membersPanel.vm.$emit('remove', 'admin-2');

    await flushPromises();

    expect(mockAdminScheduling.saveTimeslot).toHaveBeenCalledTimes(1);
    expect(mockAdminScheduling.saveTableBuckets).toHaveBeenCalledTimes(1);
    expect(mockAdminScheduling.inviteAdmin).toHaveBeenCalledTimes(1);
    expect(mockAdminScheduling.removeAdmin).toHaveBeenCalledWith('admin-2');
  });

  it('shows mutation conflict helper copy when API returns 409 code', async () => {
    mockAdminScheduling.mutationErrorCode.value = 'cannotModifyTimeslotActive';

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('無法調整座位 bucket');
  });

  it('disables management controls when user has no active admin permission', async () => {
    mockAdminScheduling.hasActiveAdmin.value = false;

    const wrapper = await mountPage();
    const manageButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('編輯時段'));

    expect(manageButton).toBeDefined();
    expect(manageButton?.attributes('disabled')).toBeDefined();
  });
});
