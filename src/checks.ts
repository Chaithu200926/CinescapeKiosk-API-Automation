import { expect } from '@playwright/test';
import type { KioskResponse } from './kiosk-api';

export interface CheckRecord {
  label: string;
  expected: string;
  actual: string;
  passed: boolean;
}

/** Response codes returned in the envelope's `code` field. */
export const Code = {
  SUCCESS: 10001,
  NOT_FOUND_OR_EXPIRED: 11001,
  DIALOG: 12001,
  ERROR: 12002,
  NO_ACTIVE_BOOKINGS: 12020,
} as const;

/**
 * Assertions that also record "check / expected / actual / result" rows for the report.
 * Each method records before throwing, so failed checks appear on the dashboard too.
 */
export class Verify {
  readonly records: CheckRecord[] = [];

  equal(label: string, actual: unknown, expected: unknown) {
    this.run(label, show(expected), actual, () => expect(actual, label).toEqual(expected));
  }

  match(label: string, actual: string, pattern: RegExp) {
    this.run(label, `matches ${pattern}`, actual, () => expect(actual, label).toMatch(pattern));
  }

  greaterThan(label: string, actual: number, min: number) {
    this.run(label, `> ${min}`, actual, () => expect(actual, label).toBeGreaterThan(min));
  }

  contains(label: string, list: unknown[], item: unknown) {
    this.run(label, `contains ${show(item)}`, list, () => expect(list, label).toContainEqual(item));
  }

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

function show(value: unknown): string {
  const text = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
  return text === undefined ? 'undefined' : text.length > 300 ? text.slice(0, 300) + '…' : text;
}
