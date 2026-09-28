// Connection settings and the HTTP headers the kiosk app sends on every API call.
import dotenv from 'dotenv';
import path from 'path';

// Load KIOSK_* settings from the .env file in the project folder (if it exists).
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

// Read a setting that must be present; stop with a clear message if it is missing.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env (or set it in the runner's .env file).`);
  }
  return value;
}

// All settings in one object.
export const config = {
  // API base address, always ending with "/".
  baseURL: required('KIOSK_API_BASE_URL').replace(/\/?$/, '/'),
  // Kiosk key sent as X-Kiosk-Key.
  apiKey: required('KIOSK_API_KEY'),
  // Cinema the kiosk is set up for.
  cinemaId: process.env.KIOSK_CINEMA_ID || '0000000001',
  // App version sent in the "appversion" header.
  appVersion: process.env.KIOSK_APP_VERSION || '1.0.0',
};

/** API base address for reports: same as baseURL but with the server host hidden (reports are public). */
export const displayBaseURL = (() => {
  const u = new URL(config.baseURL);
  return `${u.protocol}//<kiosk-api-host>${u.port ? ':' + u.port : ''}${u.pathname}`;
})();

/** Headers the CinescapeKiosk app sends on every API call. */
export function kioskHeaders(overrides: Record<string, string | undefined> = {}): Record<string, string> {
  // Start from the kiosk's standard headers, then apply the test's overrides.
  const headers: Record<string, string | undefined> = {
    Accept: 'application/json',
    platform: 'KIOSK',
    appversion: config.appVersion,
    'X-Kiosk-Key': config.apiKey,
    ...overrides,
  };
  // An override of `undefined` removes the header, which the negative auth tests rely on.
  return Object.fromEntries(Object.entries(headers).filter(([, v]) => v !== undefined)) as Record<string, string>;
}
