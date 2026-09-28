// Playwright settings for the CinescapeKiosk API test suite.
import { defineConfig } from '@playwright/test';

/**
 * API-only suite: no browsers are launched, so no `npx playwright install` is needed.
 * Connection settings (API address, key, cinema) come from .env via src/config.ts.
 */
export default defineConfig({
  // Folder that holds the test files (one test case per file).
  testDir: './tests',
  // Run test files one after another, not in parallel.
  fullyParallel: false,
  // On CI, fail if someone left a `test.only` in the code.
  forbidOnly: !!process.env.CI,
  // Do not retry failed tests, so each result is reported exactly once.
  retries: 0,
  // Use a single worker: tests run one at a time against the shared backend.
  workers: 1,
  // Give each test up to 60 seconds before it is marked as timed out.
  timeout: 60_000,
  // Where results go.
  reporter: [
    // Print each test and its result in the terminal.
    ['list'],
    // Build the Playwright HTML report in playwright-report/.
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    // Save machine-readable results; the dashboard is built from this file.
    ['json', { outputFile: 'test-results/results.json' }],
  ],
});
