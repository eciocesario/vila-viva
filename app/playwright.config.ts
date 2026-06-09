import { defineConfig, devices } from '@playwright/test';

// O service worker só existe no build de produção (devOptions.enabled: false em
// vite.config.ts), então o E2E roda contra `vite preview` (app buildado, SW ativo),
// nunca contra `vite dev`. O webServer abaixo builda e serve a versão de produção.
const PREVIEW_PORT = 4173;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PREVIEW_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL,
    headless: true,
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx vite preview --port ${PREVIEW_PORT} --strictPort`,
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
  ],
});
