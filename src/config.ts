import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env (or set it in the runner's .env file).`);
  }
  return value;
}

export const config = {
  baseURL: required('KIOSK_API_BASE_URL').replace(/\/?$/, '/'),
  apiKey: required('KIOSK_API_KEY'),
  cinemaId: process.env.KIOSK_CINEMA_ID || '0000000001',
  appVersion: process.env.KIOSK_APP_VERSION || '1.0.0',
};

/** Headers the CinescapeKiosk app sends on every API call. */
export function kioskHeaders(overrides: Record<string, string | undefined> = {}): Record<string, string> {
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
