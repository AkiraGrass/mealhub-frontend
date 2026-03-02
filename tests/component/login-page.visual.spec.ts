import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import LoginPage from '@/pages/auth/LoginPage.vue';

describe('LoginPage visual', () => {
  it('renders ant form elements', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'login', component: { template: '<div />' } },
        { path: '/restaurants', name: 'restaurants-list', component: { template: '<div />' } }
      ]
    });
    await router.push('/login');
    await router.isReady();

    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [pinia, router]
      }
    });

    expect(wrapper.text()).toContain('登入');
    expect(wrapper.find('input#credential').exists()).toBe(true);
    expect(wrapper.find('.login-card').exists()).toBe(true);
  });
});
