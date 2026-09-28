import { defineConfig } from '@playwright/test';

/**
 * API-only suite: no browsers are launched, so no `npx playwright install` is needed.
 * Connection settings come from .env via src/config.ts.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
});
