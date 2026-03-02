<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Alert as AAlert,
  Button as AButton,
  Card as ACard,
  Form as AForm,
  Input as AInput,
  Typography as ATypography
} from 'ant-design-vue';
import { MailOutlined, LockOutlined } from '@ant-design/icons-vue';
import { useLogin } from '@/composables/useLogin';
import PageShell from '@/components/layout/PageShell.vue';
import RequestState from '@/components/state/RequestState.vue';

const credential = ref('');
const password = ref('');
const formError = ref<string | null>(null);
const route = useRoute();
const router = useRouter();
const { loading, error, submitLogin, clearError } = useLogin();

const credentialFromQuery = Array.isArray(route.query.credential)
  ? route.query.credential[0]
  : route.query.credential;
if (typeof credentialFromQuery === 'string') {
  credential.value = credentialFromQuery;
}

const registerSuccessMessage = route.query.registered === '1' ? '帳號建立成功，請使用新帳號登入' : null;
const reasonMessage = route.query.reason === 'unauthorized' ? '請先登入後再繼續' : null;
const noticeMessage = registerSuccessMessage ?? reasonMessage;

const onSubmit = async (): Promise<void> => {
  if (!credential.value.trim() || !password.value.trim()) {
    formError.value = '請輸入帳號與密碼';
    return;
  }
  formError.value = null;
  await submitLogin(credential.value.trim(), password.value.trim());
};

const goRegister = async (): Promise<void> => {
  await router.push({ name: 'register' });
};
</script>

<template>
  <PageShell title="登入" layout="compact">
    <section class="login-hero">
      <div>
        <ATypography.Title :level="3" class="login-hero__title">歡迎回到 MealHub</ATypography.Title>
        <ATypography.Paragraph class="login-hero__copy">
          使用單一帳號即可管理訂位、追蹤收藏的餐廳並掌握即時通知。
        </ATypography.Paragraph>
      </div>
    </section>
    <ACard class="login-card">
      <ATypography.Paragraph v-if="noticeMessage" class="login-card__notice">
        {{ noticeMessage }}
      </ATypography.Paragraph>
      <AAlert v-if="formError" type="error" :message="formError" show-icon class="login-card__alert" />
      <RequestState
        :loading="false"
        :error="error"
        :empty="false"
        error-subtitle="請確認帳號密碼後再試一次。"
        retry-text="返回登入表單"
        @retry="clearError"
      >
        <AForm layout="vertical" class="login-form" @submit.prevent="onSubmit">
          <AForm.Item label="Email 或手機" class="login-form__item">
            <AInput
              id="credential"
              v-model:value="credential"
              name="credential"
              autocomplete="username"
              size="large"
              placeholder="hello@mealhub.tw"
            >
              <template #prefix>
                <MailOutlined />
              </template>
            </AInput>
          </AForm.Item>

          <AForm.Item label="密碼" class="login-form__item">
            <AInput.Password
              id="password"
              v-model:value="password"
              name="password"
              autocomplete="current-password"
              size="large"
              placeholder="請輸入密碼"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </AInput.Password>
          </AForm.Item>

          <div class="login-form__actions">
            <AButton
              html-type="submit"
              type="primary"
              size="large"
              :loading="loading"
              block
              aria-label="送出登入"
            >
              登入
            </AButton>
            <AButton
              html-type="button"
              type="default"
              ghost
              size="large"
              block
              class="login-form__secondary"
              @click="goRegister"
            >
              建立新帳號
            </AButton>
          </div>
        </AForm>
      </RequestState>
    </ACard>
  </PageShell>
</template>

<style scoped>
.login-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--mh-spacing-md);
  padding-bottom: var(--mh-spacing-md);
}

.login-hero__title {
  color: var(--mh-color-text-primary, #fff);
  margin-bottom: var(--mh-spacing-xs);
}

.login-hero__copy {
  color: rgba(255, 255, 255, 0.8);
  max-width: 520px;
}

.login-card {
  max-width: 460px;
  margin: 0 auto;
  background: rgba(9, 12, 22, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: var(--mh-radius-card);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.login-form__item :deep(.ant-input-affix-wrapper) {
  background: rgba(17, 24, 39, 0.75);
  border-color: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.login-form__item :deep(.ant-input) {
  color: #fff;
}

.login-form__actions {
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-sm);
}

.login-form__secondary {
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
}

.login-card__alert {
  margin-bottom: var(--mh-spacing-sm);
  background: rgba(127, 29, 29, 0.28);
  border: 1px solid rgba(248, 113, 113, 0.5);
}

.login-card__alert :deep(.ant-alert-message),
.login-card__alert :deep(.ant-alert-description) {
  color: #fee2e2;
}

.login-card__alert :deep(.ant-alert-icon) {
  color: #fca5a5;
}

.login-card__notice {
  color: var(--mh-color-accent);
}

@media (max-width: 640px) {
  .login-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
