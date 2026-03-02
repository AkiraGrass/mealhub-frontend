import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RequestState from '@/components/state/RequestState.vue';

describe('RequestState visual', () => {
  it('renders empty state', () => {
    const wrapper = mount(RequestState, {
      props: {
        loading: false,
        error: null,
        empty: true
      }
    });

    expect(wrapper.text()).toContain('目前沒有資料');
  });

  it('renders permission state', () => {
    const wrapper = mount(RequestState, {
      props: {
        loading: false,
        error: null,
        empty: false,
        permissionDenied: true
      }
    });

    expect(wrapper.text()).toContain('需要重新登入');
  });

  it('renders timeout state with localized copy', () => {
    const wrapper = mount(RequestState, {
      props: {
        loading: false,
        error: null,
        empty: false,
        timeout: true,
        timeoutTitle: '連線逾時（測試）',
        retryText: '重整頁面'
      }
    });

    expect(wrapper.text()).toContain('連線逾時（測試）');
    expect(wrapper.text()).toContain('重整頁面');
  });
});
