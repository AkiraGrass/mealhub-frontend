<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Button as AButton,
  Input as AInput,
  Select as ASelect,
  Space as ASpace,
  Table as ATable,
  Tag as ATag,
  Typography as ATypography
} from 'ant-design-vue';
import type { AvailabilitySlot, Reservation, ReservationStatus } from '@/types/reservation';

const props = defineProps<{
  reservations: Reservation[];
  slots?: AvailabilitySlot[];
  loading?: boolean;
  canCancel?: boolean;
  cancellingReservationId?: string | null;
}>();

const emit = defineEmits<{
  (event: 'filter-change', payload: { search: string; timeslot: string | null; partySize: number | null }): void;
  (event: 'cancel', reservationId: string): void;
}>();

type ReservationRow = Reservation & {
  key: string;
  timeLabel: string;
  timeslotKey: string;
};

const searchQuery = ref('');
const timeslotFilter = ref<string | null>(null);
const partySizeFilter = ref<number | null>(null);

watch([searchQuery, timeslotFilter, partySizeFilter], () => {
  emit('filter-change', {
    search: searchQuery.value.trim(),
    timeslot: timeslotFilter.value,
    partySize: partySizeFilter.value
  });
});

const formatTimeLabel = (start: string, end: string): string => {
  const formatter = new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit'
  });
  try {
    return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
  } catch {
    return `${start} - ${end}`;
  }
};

const reservationRows = computed<ReservationRow[]>(() =>
  props.reservations.map((reservation) => ({
    ...reservation,
    key: reservation.id,
    timeslotKey: reservation.slotId || reservation.start,
    timeLabel: formatTimeLabel(reservation.start, reservation.end)
  }))
);

const timeslotOptions = computed(() =>
  (props.slots ?? []).map((slot) => ({
    value: slot.slotId,
    label: formatTimeLabel(slot.start, slot.end),
    fallbackKey: slot.start
  }))
);

const partySizeOptions = computed(() => {
  const sizes = new Set<number>();
  props.reservations.forEach((reservation) => sizes.add(reservation.partySize));
  return Array.from(sizes).sort((a, b) => a - b);
});

const matchesTimeslot = (row: ReservationRow): boolean => {
  if (!timeslotFilter.value) {
    return true;
  }
  return row.timeslotKey === timeslotFilter.value;
};

const matchesPartySize = (row: ReservationRow): boolean => {
  if (!partySizeFilter.value) {
    return true;
  }
  return row.partySize === partySizeFilter.value;
};

const matchesSearch = (row: ReservationRow): boolean => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return true;
  }
  return (
    row.code.toLowerCase().includes(query) ||
    (row.notes ?? '').toLowerCase().includes(query) ||
    row.status.toLowerCase().includes(query)
  );
};

const filteredRows = computed(() => reservationRows.value.filter((row) => matchesTimeslot(row) && matchesPartySize(row) && matchesSearch(row)));

const columns = [
  { title: '時間', dataIndex: 'timeLabel', key: 'time' },
  { title: '人數', dataIndex: 'partySize', key: 'partySize' },
  { title: '狀態', dataIndex: 'status', key: 'status' },
  { title: '訂位碼', dataIndex: 'code', key: 'code' },
  { title: '備註', dataIndex: 'notes', key: 'notes' },
  { title: '操作', key: 'actions' }
];

const statusColorMap: Record<ReservationStatus, string> = {
  pending: 'default',
  confirmed: 'success',
  cancelled: 'error',
  sold_out: 'warning',
  modified: 'processing'
};

const resetFilters = (): void => {
  searchQuery.value = '';
  timeslotFilter.value = null;
  partySizeFilter.value = null;
};

const handleCancel = (reservationId: string): void => {
  emit('cancel', reservationId);
};
</script>

<template>
  <section class="admin-reservations">
    <header class="admin-reservations__header">
      <div>
        <ATypography.Title :level="4">預約列表</ATypography.Title>
        <ATypography.Paragraph type="secondary">
          依時段、人數與關鍵字搜尋管理訂位
        </ATypography.Paragraph>
      </div>
      <AButton ghost type="primary" size="small" @click="resetFilters">重設篩選</AButton>
    </header>

    <ASpace class="admin-reservations__filters" wrap>
      <AInput
        v-model:value="searchQuery"
        allow-clear
        placeholder="搜尋訂位碼 / 備註 / 狀態"
        class="admin-reservations__search"
      />

      <ASelect
        v-model:value="timeslotFilter"
        allow-clear
        class="admin-reservations__filter"
        placeholder="依時段篩選"
        style="min-width: 200px"
      >
        <ASelect.Option v-for="slot in timeslotOptions" :key="slot.value || slot.fallbackKey" :value="slot.value || slot.fallbackKey">
          {{ slot.label }}
        </ASelect.Option>
      </ASelect>

      <ASelect
        v-model:value="partySizeFilter"
        allow-clear
        class="admin-reservations__filter"
        placeholder="人數"
        style="min-width: 120px"
      >
        <ASelect.Option v-for="size in partySizeOptions" :key="size" :value="size">{{ size }} 位</ASelect.Option>
      </ASelect>
    </ASpace>

    <ATable
      :columns="columns"
      :data-source="filteredRows"
      :loading="props.loading"
      :pagination="{ pageSize: 8, hideOnSinglePage: true }"
      row-key="key"
      class="admin-reservations__table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <ATag :color="statusColorMap[record.status] || 'default'">{{ record.status }}</ATag>
        </template>
        <template v-else-if="column.key === 'actions'">
          <AButton
            danger
            ghost
            size="small"
            :disabled="props.canCancel === false || record.status === 'cancelled'"
            :loading="props.cancellingReservationId === record.id"
            @click="handleCancel(record.id)"
          >
            取消
          </AButton>
        </template>
        <template v-else-if="column.key === 'notes'">
          <span>{{ record.notes || '—' }}</span>
        </template>
        <template v-else>
          <span>{{ record[column.dataIndex] }}</span>
        </template>
      </template>
    </ATable>
  </section>
</template>

<style scoped>
.admin-reservations {
  margin-top: var(--mh-spacing-xl);
  padding: var(--mh-spacing-lg);
  background: rgba(15, 19, 30, 0.72);
  border: 1px solid rgba(212, 175, 55, 0.18);
  border-radius: var(--mh-radius-card);
}

.admin-reservations__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--mh-spacing-lg);
}

.admin-reservations__filters {
  margin: var(--mh-spacing-lg) 0;
  width: 100%;
}

.admin-reservations__search {
  min-width: 240px;
  flex: 1;
}

.admin-reservations__table :deep(.ant-table) {
  background: transparent;
  color: var(--mh-color-text-primary, #fff);
}

.admin-reservations__table :deep(.ant-table-thead > tr > th) {
  background: rgba(24, 31, 52, 0.85);
  color: var(--mh-color-text-secondary, #c8d0e0);
}

.admin-reservations__table :deep(.ant-table-tbody > tr > td) {
  background: rgba(18, 22, 34, 0.85);
  border-bottom: 1px solid rgba(212, 175, 55, 0.08);
}

@media (max-width: 768px) {
  .admin-reservations__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-reservations__filters {
    flex-direction: column;
  }

  .admin-reservations__search,
  .admin-reservations__filter {
    width: 100%;
  }
}
</style>
