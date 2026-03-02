<script setup lang="ts">
import { computed } from 'vue';
import { Card as ACard, Empty as AEmpty, Typography as ATypography } from 'ant-design-vue';
import type { AvailabilitySlot } from '@/types/reservation';

const props = defineProps<{
  slots: AvailabilitySlot[];
  title?: string;
}>();

interface ChartBar {
  partySize: number;
  available: number;
}

const chartBars = computed<ChartBar[]>(() => {
  const map = new Map<number, number>();
  props.slots.forEach((slot) => {
    slot.byPartySize?.forEach((entry) => {
      map.set(entry.partySize, (map.get(entry.partySize) ?? 0) + entry.available);
    });
  });
  return Array.from(map.entries())
    .map(([partySize, available]) => ({ partySize, available }))
    .sort((a, b) => a.partySize - b.partySize);
});

const maxValue = computed(() => Math.max(...chartBars.value.map((bar) => bar.available), 0));

const barHeight = (available: number): string => {
  if (maxValue.value === 0) {
    return '2px';
  }
  const percent = Math.max(4, (available / maxValue.value) * 100);
  return `${percent}%`;
};
</script>

<template>
  <ACard class="admin-availability-chart" :bordered="false">
    <ATypography.Title :level="4">{{ props.title || '依人數顯示可用席次' }}</ATypography.Title>
    <div v-if="chartBars.length" class="admin-availability-chart__grid">
      <div v-for="bar in chartBars" :key="bar.partySize" class="chart-bar">
        <div class="chart-bar__visual" :style="{ height: barHeight(bar.available) }">
          <span class="chart-bar__value">{{ bar.available }}</span>
        </div>
        <span class="chart-bar__label">{{ bar.partySize }} 人</span>
      </div>
    </div>
    <AEmpty v-else description="尚無可用席次資料" />
  </ACard>
</template>

<style scoped>
.admin-availability-chart {
  margin-top: var(--mh-spacing-xl);
  background: rgba(10, 14, 23, 0.9);
  border-radius: var(--mh-radius-card);
  border: 1px solid rgba(212, 175, 55, 0.16);
  padding-bottom: var(--mh-spacing-lg);
}

.admin-availability-chart__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: var(--mh-spacing-md);
  margin-top: var(--mh-spacing-lg);
}

.chart-bar {
  text-align: center;
  color: var(--mh-color-text-muted, #b4bbcd);
}

.chart-bar__visual {
  position: relative;
  width: 100%;
  background: linear-gradient(180deg, rgba(212, 175, 55, 0.6) 0%, rgba(212, 175, 55, 0.05) 100%);
  border-radius: 10px 10px 2px 2px;
  border: 1px solid rgba(212, 175, 55, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: var(--mh-spacing-xs);
  min-height: 60px;
}

.chart-bar__value {
  font-weight: 600;
  color: #fff;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
}

.chart-bar__label {
  margin-top: var(--mh-spacing-sm);
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}

@media (max-width: 768px) {
  .admin-availability-chart__grid {
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  }
}
</style>
