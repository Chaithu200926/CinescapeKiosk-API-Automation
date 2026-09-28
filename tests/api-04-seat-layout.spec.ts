// API-04: checks that asking for the seat map of a session that no longer exists is rejected clearly.
import { test, about, Code } from '../src/fixtures';
import { config } from '../src/config';

test(
  'API-04 Seat layout: an expired session is rejected',
  about(
    'Asking for the seat map of a session that no longer exists returns "Session has expired".',
    'The seat screen must not show an out-of-date seat map, which could lead to double-booked seats.',
  ),
  async ({ kioskApi, verify }) => {
    // Ask for the seat map of session 0 / area 0, which never exist.
    const res = await kioskApi.get(`content/trans/seatlayoutkiosk?cinemaId=${config.cinemaId}&sessionId=0&areacode=0`);

    // The backend must answer "Session has expired" (code 11001).
    await test.step('Verify "Session has expired" is returned', async () => {
      verify.answer(res, Code.NOT_FOUND_OR_EXPIRED, 'Session has expired');
    });
  },
);
