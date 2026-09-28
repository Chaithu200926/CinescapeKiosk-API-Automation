// Shared test setup: every test file imports `test` from here instead of from Playwright.
import { test as base, expect, TestInfo } from '@playwright/test';
import { KioskApi } from './kiosk-api';
import { Verify } from './checks';

// Extend Playwright's `test` with two ready-made helpers that each test can ask for.
export const test = base.extend<{ kioskApi: KioskApi; verify: Verify }>({
  // kioskApi: sends requests to the kiosk backend with the kiosk's headers and logs each call.
  kioskApi: async ({ request }, use, testInfo) => {
    await use(new KioskApi(request, testInfo));
  },
  // verify: assertion helper that records every check (expected vs actual) for the dashboard.
  verify: async ({}, use, testInfo) => {
    const verify = new Verify();
    // Hand the helper to the test and wait for the test to finish.
    await use(verify);
    // After the test (pass or fail), attach the recorded checks so the dashboard can show them.
    await testInfo.attach('checks', { body: JSON.stringify(verify.records, null, 2), contentType: 'application/json' });
  },
});

// Re-export so tests can import everything from one place.
export { expect };
export { Code } from './checks';

/** Adds the "What it checks" and "Why it matters" text shown on the dashboard. */
export function about(purpose: string, why: string) {
  return {
    annotation: [
      { type: 'purpose', description: purpose },
      { type: 'why', description: why },
    ],
  };
}

/** Publishes a small table (for example the movies found) on the test's dashboard card. */
export async function showTable(testInfo: TestInfo, caption: string, columns: string[], rows: string[][]) {
  await testInfo.attach(`table: ${caption}`, {
    body: JSON.stringify({ caption, columns, rows }, null, 2),
    contentType: 'application/json',
  });
}
