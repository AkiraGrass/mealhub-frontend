import { fileURLToPath, URL } from 'node:url';
import { webcrypto } from 'node:crypto';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/{unit,component}/**/*.spec.ts'],
    setupFiles: ['tests/setup.ts']
  }
});
