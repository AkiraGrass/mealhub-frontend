import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/composables/useRestaurantsList', () => ({
  useRestaurantsList: () => ({
    loading: ref(false),
    error: ref(null),
    empty: ref(true),
    items: ref([]),
    page: ref(1),
    perPage: ref(10),
    total: ref(0),
    lastPage: ref(1),
    load: vi.fn(),
    goNext: vi.fn(),
    goPrev: vi.fn(),
    timeout: ref(false),
    permissionDenied: ref(false)
  })
}));

import RestaurantsListPage from '@/pages/restaurants/RestaurantsListPage.vue';

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/restaurants', name: 'restaurants-list', component: { template: '<div />' } }
    ]
  });

describe('RestaurantsListPage', () => {
  it('shows empty state', async () => {
    const router = createTestRouter();
    await router.push('/restaurants');
    await router.isReady();

    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(RestaurantsListPage, {
      global: {
        plugins: [pinia, router]
      }
    });

    expect(wrapper.text()).toContain('目前沒有資料');
  });
});
