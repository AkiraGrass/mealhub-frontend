import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import LoginPage from '@/pages/auth/LoginPage.vue';

describe('LoginPage', () => {
  it('renders login form fields', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'login', component: { template: '<div />' } },
        { path: '/register', name: 'register', component: { template: '<div />' } },
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

    expect(wrapper.find('input[name="credential"]').exists()).toBe(true);
    expect(wrapper.find('input[name="password"]').exists()).toBe(true);
  });

  it('navigates to register page when click create account button', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'login', component: LoginPage },
        { path: '/register', name: 'register', component: { template: '<div />' } },
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

    await wrapper.find('.login-form__secondary').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('register');
  });
});
