import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import MyReservationsPage from '@/pages/reservations/MyReservationsPage.vue';
import type { Reservation } from '@/types/reservation';

const mockReservations = ref<Reservation[]>([]);
const mockLoading = ref(false);
const mockError = ref<string | null>(null);
const mockProcessing = ref(false);
const loadMyReservations = vi.fn();
const modifyReservation = vi.fn();
const cancelReservation = vi.fn();

vi.mock('@/composables/useReservations', () => ({
  useReservations: () => ({
    reservations: mockReservations,
    isLoadingReservations: mockLoading,
    errorMessage: mockError,
    isProcessingReservation: mockProcessing,
    loadMyReservations,
    modifyReservation,
    cancelReservation
  })
}));

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/reservations/my', name: 'my-reservations', component: MyReservationsPage }
    ]
  });

describe('MyReservationsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockReservations.value = [];
    mockError.value = null;
    mockLoading.value = false;
    mockProcessing.value = false;
    loadMyReservations.mockResolvedValue(undefined);
  });

  it('loads and renders reservations', async () => {
    mockReservations.value = [
      {
        id: 'r-1',
        restaurantId: 'Golden Table',
        date: '2025-04-01',
        start: '2025-04-01T18:00:00Z',
        end: '2025-04-01T19:00:00Z',
        partySize: 2,
        status: 'confirmed',
        code: 'ABC111',
        shortToken: 'AA11',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const router = createTestRouter();
    await router.push('/reservations/my');
    await router.isReady();

    const wrapper = mount(MyReservationsPage, {
      global: {
        plugins: [router]
      }
    });

    expect(loadMyReservations).toHaveBeenCalled();
    expect(wrapper.text()).toContain('ABC111');
  });

  it('shows empty state when no reservations', async () => {
    const router = createTestRouter();
    await router.push('/reservations/my');
    await router.isReady();

    const wrapper = mount(MyReservationsPage, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('目前沒有資料');
  });
});
