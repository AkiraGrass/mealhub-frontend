<script setup lang="ts">
import { computed } from 'vue';
import {
  Button as AButton,
  List as AList,
  Space as ASpace,
  Tag as ATag,
  Typography as ATypography
} from 'ant-design-vue';
import type { Reservation, ReservationStatus } from '@/types/reservation';

const props = defineProps<{
  reservations: Reservation[];
}>();

const emit = defineEmits<{ (event: 'manage', reservation: Reservation): void }>();

const dateFormatter = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' });
const timeFormatter = new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit' });

const statusColor: Record<ReservationStatus, string> = {
  pending: 'processing',
  confirmed: 'success',
  cancelled: 'default',
  sold_out: 'warning',
  modified: 'blue'
};

const statusLabel: Record<ReservationStatus, string> = {
  pending: '待確認',
  confirmed: '已確認',
  cancelled: '已取消',
  sold_out: '已額滿',
  modified: '已修改'
};

const formattedReservations = computed(() =>
  props.reservations.map((reservation) => ({
    ...reservation,
    dateLabel: dateFormatter.format(new Date(reservation.date)),
    timeLabel: `${timeFormatter.format(new Date(reservation.start))} - ${timeFormatter.format(
      new Date(reservation.end)
    )}`
  }))
);

const handleManage = (reservation: Reservation): void => {
  if (reservation.status === 'cancelled') {
    return;
  }
  emit('manage', reservation);
};
</script>

<template>
  <AList
    :data-source="formattedReservations"
    item-layout="vertical"
    size="large"
    class="my-reservations-list"
  >
    <template #renderItem="{ item }">
      <AList.Item class="my-reservations-list__item">
        <div class="item-header">
          <div>
            <ATypography.Title :level="5" class="item-title">
              {{ item.dateLabel }} · {{ item.timeLabel }}
            </ATypography.Title>
            <ATypography.Paragraph type="secondary" class="item-subtitle">
              訂位碼：{{ item.code }} · 人數：{{ item.partySize }} 位
            </ATypography.Paragraph>
          </div>
          <ASpace align="center">
            <ATag :color="statusColor[item.status]">{{ statusLabel[item.status] }}</ATag>
            <AButton
              type="primary"
              ghost
              size="small"
              :disabled="item.status === 'cancelled'"
              @click="handleManage(item)"
            >
              {{ item.status === 'cancelled' ? '已取消' : '管理' }}
            </AButton>
          </ASpace>
        </div>
        <div class="item-body">
          <ATypography.Text class="item-body__text">
            餐廳：{{ item.restaurantId }} · 訂位代碼：{{ item.shortToken }}
          </ATypography.Text>
          <ATypography.Text v-if="item.notes" class="item-body__text">
            備註：{{ item.notes }}
          </ATypography.Text>
        </div>
      </AList.Item>
    </template>
  </AList>
</template>

<style scoped>
.my-reservations-list__item {
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: var(--mh-radius-card);
  padding: var(--mh-spacing-md);
  background: rgba(14, 18, 29, 0.85);
}

.item-header {
  display: flex;
  justify-content: space-between;
  gap: var(--mh-spacing-md);
  flex-wrap: wrap;
}

.item-title {
  margin-bottom: 0;
}

.item-subtitle {
  margin-bottom: 0;
}

.item-body {
  margin-top: var(--mh-spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-xs);
}

.item-body__text {
  color: var(--mh-color-text-muted, rgba(255, 255, 255, 0.72));
}

@media (max-width: 768px) {
  .item-header {
    flex-direction: column;
  }
}
</style>
