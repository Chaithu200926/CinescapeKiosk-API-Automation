import { APIRequestContext, TestInfo, test } from '@playwright/test';
import { config, kioskHeaders } from './config';
import { assertReadOnly } from './safety';

/** Every kiosk API answer is wrapped in this envelope. */
export interface KioskEnvelope<T = unknown> {
  code: number;
  result: string;
  msg: string;
  output: T;
}

export interface KioskResponse<T = unknown> {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  body: KioskEnvelope<T>;
  rawText: string;
}

interface CallOptions {
  body?: unknown;
  headers?: Record<string, string | undefined>;
}

const MAX_ATTACHED_CHARS = 20_000;

/**
 * Thin client over Playwright's APIRequestContext.
 * Each call is wrapped in a test step and its request/response is attached to the test,
 * so the HTML report and the dashboard can show the exact response message.
 */
export class KioskApi {
  constructor(private readonly request: APIRequestContext, private readonly testInfo: TestInfo) {}

  get<T = unknown>(path: string, options: CallOptions = {}) {
    return this.call<T>('GET', path, options);
  }

  post<T = unknown>(path: string, body: unknown, options: CallOptions = {}) {
    return this.call<T>('POST', path, { ...options, body });
  }

  private async call<T>(method: 'GET' | 'POST', path: string, options: CallOptions): Promise<KioskResponse<T>> {
    return test.step(`${method} ${path}`, async () => {
      const safety = assertReadOnly(method, path);
      const headers = kioskHeaders(options.headers);
      const started = Date.now();
      const response = await this.request.fetch(config.baseURL + path, {
        method,
        headers: options.body !== undefined ? { ...headers, 'Content-Type': 'application/json' } : headers,
        data: options.body,
        failOnStatusCode: false,
      });
      const durationMs = Date.now() - started;
      const rawText = await response.text();

      let body: KioskEnvelope<T>;
      try {
        body = JSON.parse(rawText);
      } catch {
        body = { code: -1, result: 'not-json', msg: rawText.slice(0, 500), output: undefined as T };
      }

      const result: KioskResponse<T> = { method, path, status: response.status(), durationMs, body, rawText };
      await this.attach(result, {
        requestHeaders: headers,
        requestBody: options.body,
        responseHeaders: response.headers(),
        purpose: safety.purpose,
      });
      return result;
    });
  }

  private async attach(
    res: KioskResponse,
    extra: { requestHeaders: Record<string, string>; requestBody: unknown; responseHeaders: Record<string, string>; purpose: string },
  ) {
    // Never publish the kiosk key or cookies: the dashboard is public.
    const requestHeaders = { ...extra.requestHeaders };
    if (requestHeaders['X-Kiosk-Key']) requestHeaders['X-Kiosk-Key'] = '***';
    const responseHeaders = { ...extra.responseHeaders };
    if (responseHeaders['set-cookie']) responseHeaders['set-cookie'] = '***';

    const record = {
      safety: { readOnly: true, purpose: extra.purpose },
      request: { method: res.method, path: res.path, headers: requestHeaders, body: extra.requestBody ?? null },
      response: {
        status: res.status,
        durationMs: res.durationMs,
        sizeBytes: Buffer.byteLength(res.rawText, 'utf8'),
        headers: responseHeaders,
        code: res.body.code,
        result: res.body.result,
        msg: res.body.msg,
        body: res.rawText.length > MAX_ATTACHED_CHARS ? res.rawText.slice(0, MAX_ATTACHED_CHARS) + ' …(truncated)' : safeParse(res.rawText),
      },
    };
    await this.testInfo.attach(`api-call: ${res.method} ${res.path}`, {
      body: JSON.stringify(record, null, 2),
      contentType: 'application/json',
    });
    console.log(`${res.method} ${res.path} -> HTTP ${res.status} | code=${res.body.code} result=${res.body.result} msg="${res.body.msg}" (${res.durationMs} ms)`);
  }
}

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
