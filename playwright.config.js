import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173/Mockscii/',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/Mockscii/',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
