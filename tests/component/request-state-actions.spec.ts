import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RequestState from '@/components/state/RequestState.vue';

describe('RequestState actions', () => {
  it('emits retry on button click in error state', async () => {
    const wrapper = mount(RequestState, {
      props: {
        loading: false,
        error: '錯誤',
        empty: false
      }
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('retry')).toBeTruthy();
  });

  it('emits reauth when permission denied', async () => {
    const wrapper = mount(RequestState, {
      props: {
        loading: false,
        error: null,
        empty: false,
        permissionDenied: true
      }
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('reauth')).toBeTruthy();
  });
});
