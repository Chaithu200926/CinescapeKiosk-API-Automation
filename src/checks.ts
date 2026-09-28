// Assertion helper that also records each check for the dashboard ("check / expected / actual / result").
import { expect } from '@playwright/test';
import type { KioskResponse } from './kiosk-api';

/** One recorded check, shown as a row on the dashboard. */
export interface CheckRecord {
  label: string;
  expected: string;
  actual: string;
  passed: boolean;
}

/** Response codes returned in the envelope's `code` field. */
export const Code = {
  // Request worked.
  SUCCESS: 10001,
  // Item not found or session expired.
  NOT_FOUND_OR_EXPIRED: 11001,
  // Message for the customer (e.g. "User not found").
  DIALOG: 12001,
  // General error or rejected request.
  ERROR: 12002,
  // KNET status: no booking waiting for payment.
  NO_ACTIVE_BOOKINGS: 12020,
} as const;

/**
 * Assertions that also record "check / expected / actual / result" rows for the report.
 * Each method records before throwing, so failed checks appear on the dashboard too.
 */
export class Verify {
  // All checks made during the test, in order.
  readonly records: CheckRecord[] = [];

  /** Actual value must equal the expected value (deep comparison for lists/objects). */
  equal(label: string, actual: unknown, expected: unknown) {
    this.run(label, show(expected), actual, () => expect(actual, label).toEqual(expected));
  }

  /** Text must match a pattern. */
  match(label: string, actual: string, pattern: RegExp) {
    this.run(label, `matches ${pattern}`, actual, () => expect(actual, label).toMatch(pattern));
  }

  /** Number must be greater than a minimum. */
  greaterThan(label: string, actual: number, min: number) {
    this.run(label, `> ${min}`, actual, () => expect(actual, label).toBeGreaterThan(min));
  }

  /** List must contain an item. */
  contains(label: string, list: unknown[], item: unknown) {
    this.run(label, `contains ${show(item)}`, list, () => expect(list, label).toContainEqual(item));
  }

  /** Condition must be true; `expected` and `actual` are only for display. */
  isTrue(label: string, condition: boolean, expected: string, actual: unknown) {
    this.run(label, expected, actual, () => expect(condition, `${label} (actual: ${show(actual)})`).toBe(true));
  }

  /** HTTP 200 with a `success` envelope (code 10001). */
  success(res: KioskResponse) {
    this.equal(`HTTP status of ${res.path}`, res.status, 200);
    this.equal('Response code', res.body.code, Code.SUCCESS);
  }

  /** HTTP 200 with a business answer carrying the given code and message. */
  answer(res: KioskResponse, code: number, msg: string) {
    this.equal(`HTTP status of ${res.path}`, res.status, 200);
    this.equal('Response code', res.body.code, code);
    this.equal('Response message', res.body.msg, msg);
  }

  // Run one assertion and record whether it passed; re-throw failures so the test fails.
  private run(label: string, expected: string, actual: unknown, assertion: () => void) {
    try {
      assertion();
      this.records.push({ label, expected, actual: show(actual), passed: true });
    } catch (error) {
      this.records.push({ label, expected, actual: show(actual), passed: false });
      throw error;
    }
  }
}

// Format a value for display: quote text, JSON everything else, cut very long values.
function show(value: unknown): string {
  const text = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
  return text === undefined ? 'undefined' : text.length > 300 ? text.slice(0, 300) + '…' : text;
}
