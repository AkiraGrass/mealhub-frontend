import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from '@/router';
import { bootstrapSession } from './bootstrap-session';
import { httpClient } from '@/services/http/client';
import { setupHttpInterceptors } from '@/services/http/interceptors';
import { useAuthStore } from '@/stores/auth.store';
import { setupAntdProvider } from './providers/AntdProvider';
import 'ant-design-vue/dist/reset.css';
import '@/styles/global.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
setupAntdProvider(app);

const authStore = useAuthStore();
setupHttpInterceptors(httpClient, {
  getAccessToken: () => authStore.accessToken,
  getRefreshToken: () => authStore.refreshToken,
  refreshSession: async () => authStore.refreshSession(),
  onRefreshFail: () => {
    void router.push({ name: 'login', query: { reason: 'unauthorized' } });
  }
});

void bootstrapSession().finally(() => {
  app.use(router);
  app.mount('#app');
});
