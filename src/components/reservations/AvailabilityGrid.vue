<script setup lang="ts">
import { computed } from 'vue';
import {
  Empty as AEmpty,
  Skeleton as ASkeleton,
  Tag as ATag,
  Tooltip as ATooltip
} from 'ant-design-vue';
import type { AvailabilitySlot } from '@/types/reservation';

const props = withDefaults(
  defineProps<{
    slots: AvailabilitySlot[];
    selectedSlotId?: string;
    loading?: boolean;
    showEmpty?: boolean;
  }>(),
  {
    loading: false,
    showEmpty: true,
    selectedSlotId: undefined
  }
);

const emit = defineEmits<{
  (event: 'select', slotId: string): void;
}>();

const hasSlots = computed(() => props.slots.length > 0);

const handleOptionClick = (slotId: string): void => {
  emit('select', slotId);
};

const availabilityLabel = (slot: AvailabilitySlot): string => `${slot.available} / ${slot.capacity}`;

const formatTime = (value: string): string => {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(parsed);
};
</script>

<template>
  <div class="availability-grid">
    <ASkeleton v-if="loading" active :paragraph="{ rows: 4 }" />
    <template v-else>
      <div v-if="hasSlots" class="availability-grid__list">
        <button
          v-for="slot in slots"
          :key="slot.slotId"
          type="button"
          class="availability-grid__option"
          :class="{
            'availability-grid__option--selected': selectedSlotId === slot.slotId,
            'availability-grid__option--disabled': slot.available === 0
          }"
          :disabled="slot.available === 0"
          @click="handleOptionClick(slot.slotId)"
        >
          <div class="availability-grid__option-content">
            <div class="availability-grid__time">
              <span>{{ formatTime(slot.start) }}</span>
              <span class="availability-grid__dash">-</span>
              <span>{{ formatTime(slot.end) }}</span>
            </div>
            <div class="availability-grid__meta">
              <ATooltip :title="`可用座位：${availabilityLabel(slot)}`">
                <span class="availability-grid__availability">剩餘 {{ slot.available }} 席</span>
              </ATooltip>
              <ATag v-if="slot.notes" color="gold" class="availability-grid__note">{{ slot.notes }}</ATag>
            </div>
          </div>
        </button>
      </div>
      <AEmpty v-else-if="showEmpty" description="尚無可預約時段" />
    </template>
  </div>
</template>

<style scoped>
.availability-grid {
  width: 100%;
}

.availability-grid__list {
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-sm);
}

.availability-grid__option {
  width: 100%;
  text-align: left;
  border-radius: var(--mh-radius-card);
  padding: var(--mh-spacing-md);
  background: rgba(12, 17, 30, 0.88);
  border: 1px solid rgba(212, 175, 55, 0.24);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  color: #fff;
}

.availability-grid__option:hover {
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
}

.availability-grid__option--selected {
  background: linear-gradient(130deg, rgba(72, 52, 19, 0.95), rgba(36, 26, 11, 0.98));
  border-color: rgba(212, 175, 55, 0.72);
  box-shadow: 0 10px 24px rgba(212, 175, 55, 0.18);
}

.availability-grid__option--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.availability-grid__option-content {
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-xs);
}

.availability-grid__time {
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 4px;
}

.availability-grid__meta {
  display: flex;
  align-items: center;
  gap: var(--mh-spacing-xs);
  flex-wrap: wrap;
}

.availability-grid__availability {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
}

.availability-grid__note {
  border: none;
  background: rgba(212, 175, 55, 0.2);
  color: var(--mh-color-accent);
}

.availability-grid__dash {
  color: var(--mh-color-text-muted);
}
</style>
