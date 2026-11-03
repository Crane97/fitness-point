import { defineConfig } from '@playwright/test';

const PORT = 4174;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 393, height: 852 },
    locale: 'es-ES',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx expo export -p web && npx tsx scripts/serve.ts ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
