import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PageShell from '@/components/layout/PageShell.vue';

describe('PageShell', () => {
  it('renders title and slot content', () => {
    const wrapper = mount(PageShell, {
      props: { title: '標題' },
      slots: { default: '<div>content</div>' }
    });

    expect(wrapper.text()).toContain('標題');
    expect(wrapper.text()).toContain('content');
  });

  it('applies wide layout class', () => {
    const wrapper = mount(PageShell, {
      props: { title: '管理頁', layout: 'wide' },
      slots: { default: '<div>admin content</div>' }
    });

    expect(wrapper.classes()).toContain('page-shell--wide');
    expect(wrapper.text()).toContain('admin content');
  });
});
