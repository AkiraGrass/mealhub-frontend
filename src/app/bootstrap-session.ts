import { useAuthStore } from '@/stores/auth.store';

export const bootstrapSession = async (): Promise<void> => {
  const authStore = useAuthStore();
  await authStore.bootstrap();
};

