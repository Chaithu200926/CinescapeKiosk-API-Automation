import { test, about, Code } from '../src/fixtures';
import { config } from '../src/config';

test(
  'API-09 Pickup: an unknown booking reference is not found',
  about(
    'Looking up a booking reference that does not exist returns "Booking not found".',
    'Prevents printing tickets for a mistyped or fake booking reference on the Pickup screen.',
  ),
  async ({ kioskApi, verify }) => {
    const res = await kioskApi.get(`history/kiosk/booking?cinemaId=${config.cinemaId}&bookingReference=ZZZZ0000`);

    await test.step('Verify "Booking not found" is returned', async () => {
      verify.answer(res, Code.NOT_FOUND_OR_EXPIRED, 'Booking not found');
    });
  },
);
