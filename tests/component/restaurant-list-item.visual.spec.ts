import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import RestaurantListItem from '@/components/restaurants/RestaurantListItem.vue';

describe('RestaurantListItem visual', () => {
  it('renders with image and core metadata', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div />' } },
        { path: '/restaurants/:restaurantId', name: 'restaurant-detail', component: { template: '<div />' } }
      ]
    });
    await router.push('/');
    await router.isReady();

    const wrapper = mount(RestaurantListItem, {
      props: {
        item: {
          id: 1,
          name: '測試餐廳',
          description: '描述',
          address: 'Taipei',
          status: 'ACTIVE',
          cuisineType: 'fine-dining'
        }
      },
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('測試餐廳');
    expect(wrapper.text()).toContain('查看詳情');
    expect(wrapper.text()).toContain('地址 / Address');
    expect(wrapper.text()).toContain('Taipei');
    expect(wrapper.text()).not.toContain('ACTIVE');
  });
});
