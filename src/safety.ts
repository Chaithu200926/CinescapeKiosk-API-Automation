/**
 * Read-only safeguard.
 *
 * The suite runs against a shared backend, so it may only call endpoints that do not create,
 * change or delete data, and do not send SMS/email. Any other endpoint is refused before the
 * request leaves the machine.
 *
 * POST is allowed here only where the kiosk uses it to send lookup filters
 * (e.g. content/csessions = "get programme"), or for a login attempt with a non-existent user.
 */
export const READ_ONLY_ENDPOINTS: Record<string, { method: 'GET' | 'POST'; purpose: string }> = {
  'content/cinemas': { method: 'GET', purpose: 'List cinemas' },
  'content/csessions': { method: 'POST', purpose: 'Get programme (lookup; POST carries filters)' },
  'content/comingsoon': { method: 'POST', purpose: 'Get coming-soon films (lookup)' },
  'content/email-domains': { method: 'GET', purpose: 'List email domains' },
  'content/food/getfood': { method: 'POST', purpose: 'Get food menu (lookup)' },
  'content/trans/tickettype': { method: 'GET', purpose: 'Get ticket types for a session' },
  'content/trans/seatlayoutkiosk': { method: 'GET', purpose: 'Get seat layout for a session' },
  'clubcard/getamounts': { method: 'GET', purpose: 'List club card top-up amounts' },
  'history/kiosk/booking': { method: 'GET', purpose: 'Look up a booking for pickup' },
  'payment/knet/kiosk/status': { method: 'GET', purpose: 'Read KNET payment status' },
  'customer/login': { method: 'POST', purpose: 'Login attempt (tests use a non-existent user only)' },
};

/** Endpoints that change backend data, send messages or belong to the booking/payment flow. */
export const MUTATING_ENDPOINTS = [
  'content/trans/reserveseats',
  'content/trans/cancel',
  'content/trans/tckbooked',
  'content/trans/tcksummary',
  'content/food/addconcession',
  'content/food/kiosk/prepare',
  'content/kioskLogs',
  'content/kiosk-alerts/printer',
  'payment/knet/kiosk/hmac',
  'payment/knet/kiosk/confirm',
  'clubcard/kiosk/pay',
  'clubcard/addRechargeCard',
  'customer/register',
  'customer/getOtp',
  'customer/mverify',
  'customer/verifyUser',
  'history/kiosk/mark-collected',
  'history/resend',
];

/** Throws unless method + path is on the read-only allowlist. */
export function assertReadOnly(method: string, pathWithQuery: string) {
  const path = pathWithQuery.split('?')[0].replace(/^\/+|\/+$/g, '');
  const rule = READ_ONLY_ENDPOINTS[path];
  if (rule && rule.method === method) return rule;

  const why = MUTATING_ENDPOINTS.includes(path)
    ? 'it changes backend data, sends messages or is part of the booking/payment flow'
    : rule
      ? `only ${rule.method} is allowed for it`
      : 'it is not on the read-only allowlist in src/safety.ts';
  throw new Error(`Blocked ${method} ${path}: ${why}. Request was NOT sent.`);
}
