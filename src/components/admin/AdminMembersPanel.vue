<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  Alert as AAlert,
  Button as AButton,
  Card as ACard,
  Empty as AEmpty,
  Form as AForm,
  Input as AInput,
  Modal as AModal,
  Popconfirm as APopconfirm,
  Select as ASelect,
  Space as ASpace,
  Tag as ATag,
  Typography as ATypography,
  message as messageApi
} from 'ant-design-vue';
import type { InviteRestaurantAdminPayload } from '@/services/api/admin.api';
import type { RestaurantAdmin } from '@/types/reservation';

defineOptions({ name: 'AdminMembersPanel' });

const props = defineProps<{
  admins: RestaurantAdmin[];
  disabled?: boolean;
  saving?: boolean;
  errorCode?: string | null;
}>();

const emit = defineEmits<{
  (event: 'invite', payload: InviteRestaurantAdminPayload): void;
  (event: 'remove', adminId: string): void;
}>();

const message = messageApi;
const inviteOpen = ref(false);

const inviteForm = reactive<InviteRestaurantAdminPayload>({
  name: '',
  email: '',
  role: 'operator'
});

const errorCopyMap: Record<string, string> = {
  atLeastOneActiveAdminRequired: '至少需保留一名 active 管理員，無法移除最後一位。',
  conflict: '管理員資料發生衝突，請重新整理後再試。'
};

const mutationErrorMessage = computed(() => {
  if (!props.errorCode) {
    return '';
  }
  return errorCopyMap[props.errorCode] ?? `操作失敗：${props.errorCode}`;
});

const activeAdminCount = computed(
  () => props.admins.filter((admin: RestaurantAdmin) => admin.status === 'active').length
);

const canRemove = (target: RestaurantAdmin): boolean => {
  if (props.disabled || props.saving) {
    return false;
  }
  if (target.status !== 'active') {
    return true;
  }
  return activeAdminCount.value > 1;
};

const resetInviteForm = (): void => {
  inviteForm.name = '';
  inviteForm.email = '';
  inviteForm.role = 'operator';
};

const openInviteModal = (): void => {
  if (props.disabled || props.saving) {
    return;
  }
  inviteOpen.value = true;
};

const closeInviteModal = (): void => {
  inviteOpen.value = false;
  resetInviteForm();
};

watch(
  () => props.saving,
  (saving: boolean | undefined, previous: boolean | undefined) => {
    if (previous && !saving && !props.errorCode && inviteOpen.value) {
      closeInviteModal();
    }
  }
);

const handleInvite = (): void => {
  if (props.disabled || props.saving) {
    return;
  }
  if (!inviteForm.name.trim()) {
    message.warning('請輸入管理員名稱');
    return;
  }
  if (!inviteForm.email.includes('@')) {
    message.warning('請輸入有效 Email');
    return;
  }
  emit('invite', {
    name: inviteForm.name.trim(),
    email: inviteForm.email.trim(),
    role: inviteForm.role
  });
};

const handleRemove = (adminId: string): void => {
  if (props.disabled || props.saving) {
    return;
  }
  emit('remove', adminId);
};

const statusColor = (status: RestaurantAdmin['status']): string => {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'invited') {
    return 'processing';
  }
  return 'default';
};
</script>

<template>
  <ACard class="admin-members" :bordered="false">
    <header class="admin-members__header">
      <div>
        <ATypography.Title :level="5">管理員設定</ATypography.Title>
        <ATypography.Paragraph type="secondary" class="admin-members__copy">
          新增管理員會送出邀請，移除時會檢查至少保留一位 active 管理員。
        </ATypography.Paragraph>
      </div>
      <AButton type="primary" ghost :disabled="disabled || saving" @click="openInviteModal">
        新增管理員
      </AButton>
    </header>

    <AAlert
      v-if="mutationErrorMessage"
      type="warning"
      show-icon
      class="admin-members__alert"
      :message="mutationErrorMessage"
    />

    <AEmpty v-if="!admins.length" description="尚無管理員資料" class="admin-members__empty" />

    <div v-else class="admin-members__list">
      <article v-for="admin in admins" :key="admin.id" class="admin-member-card">
        <div>
          <ATypography.Text strong>{{ admin.name }}</ATypography.Text>
          <ATypography.Paragraph type="secondary" class="admin-member-card__email">
            {{ admin.email }}
          </ATypography.Paragraph>
          <ASpace size="small">
            <ATag>{{ admin.role }}</ATag>
            <ATag :color="statusColor(admin.status)">{{ admin.status }}</ATag>
          </ASpace>
        </div>
        <APopconfirm
          title="確定移除此管理員？"
          ok-text="移除"
          cancel-text="取消"
          @confirm="handleRemove(admin.id)"
        >
          <AButton danger type="text" :disabled="!canRemove(admin)">移除</AButton>
        </APopconfirm>
      </article>
    </div>

    <AModal
      :open="inviteOpen"
      title="新增管理員"
      ok-text="送出邀請"
      cancel-text="取消"
      :confirm-loading="saving"
      @ok="handleInvite"
      @cancel="closeInviteModal"
    >
      <AForm layout="vertical">
        <AForm.Item label="名稱" required>
          <AInput v-model:value="inviteForm.name" placeholder="王小明" />
        </AForm.Item>
        <AForm.Item label="Email" required>
          <AInput v-model:value="inviteForm.email" placeholder="owner@example.com" />
        </AForm.Item>
        <AForm.Item label="角色">
          <ASelect v-model:value="inviteForm.role">
            <ASelect.Option value="owner">owner</ASelect.Option>
            <ASelect.Option value="operator">operator</ASelect.Option>
          </ASelect>
        </AForm.Item>
      </AForm>
    </AModal>
  </ACard>
</template>

<style scoped>
.admin-members {
  background: rgba(15, 19, 30, 0.72);
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.admin-members__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--mh-spacing-sm);
}

.admin-members__copy {
  margin-bottom: 0;
}

.admin-members__alert {
  margin-top: var(--mh-spacing-sm);
}

.admin-members__list {
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-sm);
  margin-top: var(--mh-spacing-md);
}

.admin-member-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--mh-spacing-sm);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 12px;
  padding: var(--mh-spacing-sm) var(--mh-spacing-md);
  background: rgba(9, 12, 22, 0.45);
}

.admin-member-card__email {
  margin-bottom: var(--mh-spacing-xs);
}

@media (max-width: 768px) {
  .admin-member-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
