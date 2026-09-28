import { test as base, expect } from '@playwright/test';
import { KioskApi } from './kiosk-api';
import { Verify } from './checks';

export const test = base.extend<{ kioskApi: KioskApi; verify: Verify }>({
  kioskApi: async ({ request }, use, testInfo) => {
    await use(new KioskApi(request, testInfo));
  },
  // Records every check; attached after the test (pass or fail) for the dashboard.
  verify: async ({}, use, testInfo) => {
    const verify = new Verify();
    await use(verify);
    await testInfo.attach('checks', { body: JSON.stringify(verify.records, null, 2), contentType: 'application/json' });
  },
});

export { expect };
export { Code } from './checks';

/** Adds the "purpose" and "why it matters" annotations shown on the dashboard. */
export function about(purpose: string, why: string) {
  return {
    annotation: [
      { type: 'purpose', description: purpose },
      { type: 'why', description: why },
    ],
  };
}
