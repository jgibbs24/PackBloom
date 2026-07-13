import react from '@vitejs/plugin-react';
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
