// API client used by every test: sends the request, parses the answer and records it for the report.
import { APIRequestContext, APIResponse, TestInfo, test } from '@playwright/test';
import { config, displayBaseURL, kioskHeaders } from './config';
import { assertReadOnly } from './safety';

/** Every kiosk API answer is wrapped in this envelope. */
export interface KioskEnvelope<T = unknown> {
  // Business result code, e.g. 10001 = success.
  code: number;
  // "success", "dialog" or "error".
  result: string;
  // Message the kiosk shows to the customer.
  msg: string;
  // The actual data.
  output: T;
}

/** What a test gets back from a call. */
export interface KioskResponse<T = unknown> {
  method: string;
  path: string;
  // HTTP status code.
  status: number;
  // How long the call took.
  durationMs: number;
  // Parsed JSON answer.
  body: KioskEnvelope<T>;
  // Answer exactly as received.
  rawText: string;
}

/** Optional extras for a call. */
interface CallOptions {
  // JSON body to send (POST).
  body?: unknown;
  // Header overrides; `undefined` removes a header.
  headers?: Record<string, string | undefined>;
}

// Largest response body stored in the report (longer ones are cut).
const MAX_ATTACHED_CHARS = 20_000;

/**
 * Thin client over Playwright's APIRequestContext.
 * Each call is wrapped in a test step and its request/response is attached to the test,
 * so the HTML report and the dashboard can show the exact response message.
 */
export class KioskApi {
  constructor(private readonly request: APIRequestContext, private readonly testInfo: TestInfo) {}

  /** Send a GET request. */
  get<T = unknown>(path: string, options: CallOptions = {}) {
    return this.call<T>('GET', path, options);
  }

  /** Send a POST request with a JSON body. */
  post<T = unknown>(path: string, body: unknown, options: CallOptions = {}) {
    return this.call<T>('POST', path, { ...options, body });
  }

  private async call<T>(method: 'GET' | 'POST', path: string, options: CallOptions): Promise<KioskResponse<T>> {
    // Show the call as its own step in the report, e.g. "GET content/cinemas".
    return test.step(`${method} ${path}`, async () => {
      // Safety first: refuse anything that is not on the read-only allowlist (nothing is sent).
      const safety = assertReadOnly(method, path);
      // Build the kiosk headers for this call.
      const headers = kioskHeaders(options.headers);

      // Send the request and time it. failOnStatusCode:false lets tests check 401/403 answers.
      const started = Date.now();
      let response: APIResponse;
      try {
        response = await this.request.fetch(config.baseURL + path, {
          method,
          headers: options.body !== undefined ? { ...headers, 'Content-Type': 'application/json' } : headers,
          data: options.body,
          failOnStatusCode: false,
        });
      } catch (error) {
        // Network errors (e.g. server down) name the server address; hide it, because reports are public.
        const host = new URL(config.baseURL).hostname;
        const first = String((error as Error).message).split('\n')[0];
        throw new Error(`${method} ${displayBaseURL + path} failed: ${first.split(host).join('<kiosk-api-host>')}`);
      }
      const durationMs = Date.now() - started;
      const rawText = await response.text();

      // Parse the JSON answer; if it is not JSON, keep the text as the message.
      let body: KioskEnvelope<T>;
      try {
        body = JSON.parse(rawText);
      } catch {
        body = { code: -1, result: 'not-json', msg: rawText.slice(0, 500), output: undefined as T };
      }

      // Record the call for the report, then give the result to the test.
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

  /** Saves the request and response on the test so the dashboard can display them. */
  private async attach(
    res: KioskResponse,
    extra: { requestHeaders: Record<string, string>; requestBody: unknown; responseHeaders: Record<string, string>; purpose: string },
  ) {
    // Never publish the kiosk key or cookies: the dashboard is public.
    const requestHeaders = { ...extra.requestHeaders };
    if (requestHeaders['X-Kiosk-Key']) requestHeaders['X-Kiosk-Key'] = '***';
    const responseHeaders = { ...extra.responseHeaders };
    if (responseHeaders['set-cookie']) responseHeaders['set-cookie'] = '***';

    // Everything the dashboard shows about this call.
    const record = {
      safety: { readOnly: true, purpose: extra.purpose },
      // url = the full address that was called (API base + path), with the server host hidden.
      request: { method: res.method, path: res.path, url: displayBaseURL + res.path, headers: requestHeaders, body: extra.requestBody ?? null },
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
    // Attach it to the test result (read later by scripts/generate-dashboard.js).
    await this.testInfo.attach(`api-call: ${res.method} ${res.path}`, {
      body: JSON.stringify(record, null, 2),
      contentType: 'application/json',
    });
    // Also print a one-line summary in the terminal.
    console.log(`${res.method} ${displayBaseURL + res.path} -> HTTP ${res.status} | code=${res.body.code} result=${res.body.result} msg="${res.body.msg}" (${res.durationMs} ms)`);
  }
}

// Turn text into JSON when possible, otherwise keep the text.
function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
