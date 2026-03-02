<script setup lang="ts">
import { computed } from 'vue';
import { Card as ACard, Space as ASpace, Statistic as AStatistic, Tag as ATag, Typography as ATypography } from 'ant-design-vue';
import type { AvailabilitySlot, TableBucket } from '@/types/reservation';

const props = defineProps<{
  slots: AvailabilitySlot[];
  tableBuckets?: TableBucket[];
  dateLabel?: string;
}>();

const totals = computed(() => {
  const summary = props.slots.reduce(
    (acc, slot) => {
      acc.capacity += slot.capacity;
      acc.reserved += slot.reserved;
      acc.available += Math.max(0, slot.available);
      return acc;
    },
    { capacity: 0, reserved: 0, available: 0 }
  );
  const buckets = (props.tableBuckets ?? []).reduce(
    (acc, bucket) => {
      acc.available += Math.max(0, bucket.available);
      acc.reserved += Math.max(0, bucket.reserved);
      return acc;
    },
    { reserved: 0, available: 0 }
  );

  return {
    capacity: summary.capacity,
    reserved: summary.reserved,
    available: summary.available,
    bucketReserved: buckets.reserved,
    bucketAvailable: buckets.available
  };
});

const utilization = computed(() => {
  if (totals.value.capacity <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((totals.value.reserved / totals.value.capacity) * 100));
});

const summaryItems = computed(() => [
  {
    key: 'capacity',
    label: '總座位容量',
    value: totals.value.capacity,
    suffix: '席'
  },
  {
    key: 'reserved',
    label: '已預約',
    value: totals.value.reserved,
    suffix: '席'
  },
  {
    key: 'available',
    label: '剩餘座位',
    value: totals.value.available,
    suffix: '席'
  }
]);
</script>

<template>
  <section class="admin-summary">
    <header class="admin-summary__header">
      <ATypography.Title :level="4">每日概覽</ATypography.Title>
      <ATag color="gold" class="admin-summary__tag">{{ props.dateLabel || '今日' }}</ATag>
    </header>
    <ASpace class="admin-summary__cards" wrap size="large">
      <ACard
        v-for="item in summaryItems"
        :key="item.key"
        :bordered="false"
        class="admin-summary__card"
      >
        <ATypography.Text type="secondary" class="admin-summary__card-label">{{ item.label }}</ATypography.Text>
        <AStatistic :value="item.value" :suffix="item.suffix" class="admin-summary__card-value" />
      </ACard>
      <ACard class="admin-summary__card admin-summary__card--util" :bordered="false">
        <ATypography.Text type="secondary" class="admin-summary__card-label">利用率</ATypography.Text>
        <div class="admin-summary__util">
          <span class="admin-summary__util-value">{{ utilization }}%</span>
          <span class="admin-summary__util-detail">
            Bucket 剩餘 {{ totals.bucketAvailable }} / 已預約 {{ totals.bucketReserved }}
          </span>
        </div>
      </ACard>
    </ASpace>
  </section>
</template>

<style scoped>
.admin-summary {
  padding: var(--mh-spacing-lg);
  background: rgba(15, 19, 30, 0.72);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--mh-radius-card);
}

.admin-summary__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--mh-spacing-lg);
}

.admin-summary__tag {
  border: none;
  color: #1a1204;
  font-weight: 600;
}

.admin-summary__cards {
  width: 100%;
}

.admin-summary__card {
  min-width: 200px;
  background: rgba(24, 31, 52, 0.9);
  border-radius: var(--mh-radius-card);
  box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.08);
}

.admin-summary__card-label {
  display: block;
  margin-bottom: var(--mh-spacing-xs);
  letter-spacing: 0.02em;
}

.admin-summary__card-value :deep(.ant-statistic-content-value) {
  color: var(--mh-color-accent, #d4af37);
}

.admin-summary__card--util {
  flex: 1;
  min-width: 260px;
}

.admin-summary__util {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-summary__util-value {
  font-size: 2rem;
  font-weight: 600;
  color: var(--mh-color-accent, #d4af37);
}

.admin-summary__util-detail {
  font-size: 0.9rem;
  color: var(--mh-color-text-muted, #a9b1c4);
}

@media (max-width: 768px) {
  .admin-summary {
    padding: var(--mh-spacing-md);
  }

  .admin-summary__card {
    width: 100%;
  }
}
</style>
