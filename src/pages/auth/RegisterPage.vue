<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Button as AButton,
  Card as ACard,
  Form as AForm,
  Input as AInput,
  Typography as ATypography
} from 'ant-design-vue';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons-vue';
import PageShell from '@/components/layout/PageShell.vue';
import RequestState from '@/components/state/RequestState.vue';
import { useRegister } from '@/composables/useRegister';

const router = useRouter();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');

const { loading, error, fieldErrors, submitRegister, clearError } = useRegister();

const onSubmit = async (): Promise<void> => {
  await submitRegister({
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    phone: phone.value,
    password: password.value,
    confirmPassword: confirmPassword.value
  });
};

const backToLogin = async (): Promise<void> => {
  await router.push({ name: 'login' });
};
</script>

<template>
  <PageShell title="建立新帳號" compact>
    <section class="register-hero">
      <ATypography.Title :level="3" class="register-hero__title">加入 MealHub</ATypography.Title>
      <ATypography.Paragraph class="register-hero__copy">
        建立帳號後即可快速訂位、追蹤餐廳與管理個人預約記錄。
      </ATypography.Paragraph>
    </section>
    <ACard class="register-card">
      <RequestState
        :loading="false"
        :error="error"
        :empty="false"
        error-subtitle="請稍後再試，或檢查輸入資訊後重新送出。"
        retry-text="返回註冊表單"
        @retry="clearError"
      >
        <AForm layout="vertical" class="register-form" @submit.prevent="onSubmit">
          <AForm.Item
            label="名字"
            :validate-status="fieldErrors.firstName ? 'error' : undefined"
            :help="fieldErrors.firstName"
          >
            <AInput
              id="firstName"
              v-model:value="firstName"
              name="firstName"
              autocomplete="given-name"
              size="large"
              placeholder="Akira"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </AInput>
          </AForm.Item>

          <AForm.Item
            label="姓氏"
            :validate-status="fieldErrors.lastName ? 'error' : undefined"
            :help="fieldErrors.lastName"
          >
            <AInput
              id="lastName"
              v-model:value="lastName"
              name="lastName"
              autocomplete="family-name"
              size="large"
              placeholder="Lin"
            >
              <template #prefix>
                <UserOutlined />
              </template>
            </AInput>
          </AForm.Item>

          <AForm.Item
            label="Email"
            :validate-status="fieldErrors.email ? 'error' : undefined"
            :help="fieldErrors.email"
          >
            <AInput
              id="email"
              v-model:value="email"
              name="email"
              autocomplete="email"
              size="large"
              placeholder="hello@mealhub.tw"
            >
              <template #prefix>
                <MailOutlined />
              </template>
            </AInput>
          </AForm.Item>

          <AForm.Item
            label="手機"
            :validate-status="fieldErrors.phone ? 'error' : undefined"
            :help="fieldErrors.phone"
          >
            <AInput
              id="phone"
              v-model:value="phone"
              name="phone"
              autocomplete="tel"
              size="large"
              placeholder="0912345678"
            >
              <template #prefix>
                <PhoneOutlined />
              </template>
            </AInput>
          </AForm.Item>

          <AForm.Item
            label="密碼"
            :validate-status="fieldErrors.password ? 'error' : undefined"
            :help="fieldErrors.password"
          >
            <AInput.Password
              id="password"
              v-model:value="password"
              name="password"
              autocomplete="new-password"
              size="large"
              placeholder="至少 8 個字元"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </AInput.Password>
          </AForm.Item>

          <AForm.Item
            label="確認密碼"
            :validate-status="fieldErrors.confirmPassword ? 'error' : undefined"
            :help="fieldErrors.confirmPassword"
          >
            <AInput.Password
              id="confirmPassword"
              v-model:value="confirmPassword"
              name="confirmPassword"
              autocomplete="new-password"
              size="large"
              placeholder="請再次輸入密碼"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </AInput.Password>
          </AForm.Item>

          <div class="register-form__actions">
            <AButton html-type="submit" type="primary" size="large" :loading="loading" block>
              建立帳號
            </AButton>
            <AButton html-type="button" type="default" ghost size="large" block @click="backToLogin">
              返回登入
            </AButton>
          </div>
        </AForm>
      </RequestState>
    </ACard>
  </PageShell>
</template>

<style scoped>
.register-hero {
  max-width: 520px;
  margin: 0 auto;
  text-align: center;
  padding-bottom: var(--mh-spacing-md);
}

.register-hero__title {
  color: var(--mh-color-text-primary, #fff);
}

.register-hero__copy {
  color: rgba(255, 255, 255, 0.8);
}

.register-card {
  max-width: 520px;
  margin: 0 auto;
  background: rgba(9, 12, 22, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: var(--mh-radius-card);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.register-form :deep(.ant-input-affix-wrapper) {
  background: rgba(17, 24, 39, 0.75);
  border-color: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.register-form :deep(.ant-input) {
  color: #fff;
}

.register-form__actions {
  display: flex;
  flex-direction: column;
  gap: var(--mh-spacing-sm);
}
</style>
