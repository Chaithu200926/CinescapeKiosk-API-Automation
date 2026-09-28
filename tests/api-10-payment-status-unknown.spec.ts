// API-10: checks the KNET payment status answer for a booking that does not exist.
import { test, about, Code } from '../src/fixtures';

test(
  'API-10 KNET payment status: an unknown booking has no active booking',
  about(
    'Checking KNET payment status for a booking that does not exist returns "There are no active bookings." (not 403/404).',
    'The kiosk polls this endpoint after every card payment. The logs show thousands of 403/404 answers here.',
  ),
  async ({ kioskApi, verify }) => {
    // Read the payment status of made-up track/booking IDs (read-only).
    const res = await kioskApi.get('payment/knet/kiosk/status?trackId=0&bookingId=0');

    // The backend must answer "There are no active bookings." (code 12020).
    await test.step('Verify "There are no active bookings." is returned', async () => {
      verify.answer(res, Code.NO_ACTIVE_BOOKINGS, 'There are no active bookings.');
    });
  },
);
