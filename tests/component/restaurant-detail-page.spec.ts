import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/components/reservations/ReservationForm.vue', () => ({
  default: {
    name: 'ReservationForm',
    template: '<div class="reservation-form-stub" />'
  }
}));

vi.mock('@/composables/useRestaurantDetail', () => ({
  useRestaurantDetail: () => ({
    loading: ref(false),
    error: ref('讀取詳情失敗'),
    detail: ref(null),
    load: vi.fn(),
    backToList: vi.fn(),
    timeout: ref(false),
    permissionDenied: ref(false)
  })
}));

import RestaurantDetailPage from '@/pages/restaurants/RestaurantDetailPage.vue';

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/restaurants', name: 'restaurants-list', component: { template: '<div />' } },
      { path: '/restaurants/:restaurantId', name: 'restaurant-detail', component: { template: '<div />' } }
    ]
  });

describe('RestaurantDetailPage', () => {
  it('shows error state', async () => {
    const router = createTestRouter();
    await router.push('/restaurants/1');
    await router.isReady();

    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(RestaurantDetailPage, {
      global: {
        plugins: [pinia, router]
      }
    });
    expect(wrapper.text()).toContain('讀取詳情失敗');
  });
});
