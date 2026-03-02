import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import ReservationForm from '@/components/reservations/ReservationForm.vue';

const createMockApi = () => {
  const availability = ref([
    {
      slotId: 'slot-1',
      start: '18:00',
      end: '20:00',
      capacity: 10,
      reserved: 4,
      available: 6,
      byPartySize: []
    }
  ]);
  const formState = ref({
    selectedDate: '2025-01-01',
    partySize: 2,
    availability: [],
    isSubmitting: false,
    businessError: undefined as string | undefined,
    selectedSlotId: undefined as string | undefined
  });
  const selectedSlot = ref(null);
  const isLoadingAvailability = ref(false);
  const errorMessage = ref<string | null>(null);
  const availabilityTimeout = ref(false);
  const availabilityPermissionDenied = ref(false);

  const selectSlot = (slotId?: string) => {
    formState.value.selectedSlotId = slotId;
    selectedSlot.value = availability.value.find((slot) => slot.slotId === slotId) ?? null;
  };

  return {
    availability,
    formState,
    selectedSlot,
    isLoadingAvailability,
    errorMessage,
    canSubmit: computed(() => Boolean(formState.value.selectedSlotId) && !formState.value.isSubmitting),
    availabilityTimeout,
    availabilityPermissionDenied,
    loadAvailability: vi.fn(),
    createReservation: vi.fn(),
    selectSlot: vi.fn(selectSlot),
    resetFormState: vi.fn()
  };
};

let mockApi = createMockApi();

vi.mock('@/composables/useReservations', () => ({
  useReservations: () => mockApi
}));

const startLookup = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.find('form').trigger('submit');
  await flushPromises();
};

const selectFirstSlot = async (wrapper: ReturnType<typeof mount>) => {
  const option = wrapper.find('.availability-grid__option');
  await option.trigger('click');
  mockApi.formState.value.selectedSlotId = mockApi.availability.value[0].slotId;
  await flushPromises();
};

const goToConfirmation = async (wrapper: ReturnType<typeof mount>) => {
  await wrapper.findAll('.reservation-form__actions button')[1].trigger('click');
  await flushPromises();
};

const fillContactForm = async (wrapper: ReturnType<typeof mount>) => {
  await flushPromises();
  await wrapper.find('input[name="contact-name"]').setValue('Tester');
  await wrapper.find('input[name="contact-phone"]').setValue('0912-000-000');
  await wrapper.find('input[name="contact-email"]').setValue('tester@example.com');
};

describe('ReservationForm', () => {
  beforeEach(() => {
    mockApi = createMockApi();
  });

  it('renders success result after booking', async () => {
    mockApi.loadAvailability.mockResolvedValue(undefined);
    mockApi.createReservation.mockResolvedValue({
      id: 'r-1',
      restaurantId: '1',
      date: '2025-01-01',
      start: '18:00',
      end: '20:00',
      partySize: 2,
      status: 'confirmed',
      code: 'ABC123',
      shortToken: 'XYZ',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const wrapper = mount(ReservationForm, {
      props: { restaurantId: 1, restaurantName: 'Golden Table' }
    });

    await startLookup(wrapper);
    await selectFirstSlot(wrapper);
    await goToConfirmation(wrapper);
    await fillContactForm(wrapper);
    const submitButtons = wrapper.findAll('.reservation-form__actions button');
    await submitButtons[1].trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('成功預約 Golden Table');
    expect(mockApi.createReservation).toHaveBeenCalled();
  });

  it('shows sold out alert when reservation fails with business error', async () => {
    mockApi.loadAvailability.mockResolvedValue(undefined);
    mockApi.createReservation.mockImplementation(async () => {
      mockApi.formState.value.businessError = 'sold_out';
      throw new Error('sold');
    });

    const wrapper = mount(ReservationForm, {
      props: { restaurantId: 1 }
    });

    await startLookup(wrapper);
    await selectFirstSlot(wrapper);
    await goToConfirmation(wrapper);
    await fillContactForm(wrapper);
    const submitButtons = wrapper.findAll('.reservation-form__actions button');
    await submitButtons[1].trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('本時段已滿位');
  });

  it('shows timeout state when availability lookup times out', async () => {
    mockApi.loadAvailability.mockImplementation(async () => {
      mockApi.errorMessage.value = '連線逾時';
      mockApi.availabilityTimeout.value = true;
      throw new Error('timeout');
    });

    const wrapper = mount(ReservationForm, {
      props: { restaurantId: 1 }
    });

    await startLookup(wrapper);

    expect(wrapper.text()).toContain('連線逾時');
  });

  it('shows permission denied state when lookup returns 403', async () => {
    mockApi.loadAvailability.mockImplementation(async () => {
      mockApi.availabilityPermissionDenied.value = true;
      throw new Error('forbidden');
    });

    const wrapper = mount(ReservationForm, {
      props: { restaurantId: 1 }
    });

    await startLookup(wrapper);

    expect(wrapper.text()).toContain('需要重新登入');
  });
});
