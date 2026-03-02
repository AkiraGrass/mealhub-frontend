import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import RegisterPage from '@/pages/auth/RegisterPage.vue';

describe('RegisterPage', () => {
  it('renders register form fields', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/register', name: 'register', component: RegisterPage },
        { path: '/login', name: 'login', component: { template: '<div />' } }
      ]
    });
    await router.push('/register');
    await router.isReady();

    const wrapper = mount(RegisterPage, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.find('input[name="firstName"]').exists()).toBe(true);
    expect(wrapper.find('input[name="lastName"]').exists()).toBe(true);
    expect(wrapper.find('input[name="email"]').exists()).toBe(true);
    expect(wrapper.find('input[name="phone"]').exists()).toBe(true);
    expect(wrapper.find('input[name="password"]').exists()).toBe(true);
    expect(wrapper.find('input[name="confirmPassword"]').exists()).toBe(true);
  });
});
