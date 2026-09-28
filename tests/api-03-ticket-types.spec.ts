// API-03: checks that asking for ticket types of a session that no longer exists is rejected clearly.
import { test, about, Code } from '../src/fixtures';
import { config } from '../src/config';

test(
  'API-03 Ticket types: an expired session is rejected',
  about(
    'Asking for ticket types of a session that no longer exists returns a clear "Session has expired" answer.',
    'A customer who waits too long on the kiosk must get a clear message instead of a crash or wrong prices.',
  ),
  async ({ kioskApi, verify }) => {
    // Ask for ticket types of session 0, which never exists.
    const res = await kioskApi.get(`content/trans/tickettype?cinemaId=${config.cinemaId}&sessionId=0`);

    // The backend must answer "Session has expired" (code 11001).
    await test.step('Verify "Session has expired" is returned', async () => {
      verify.answer(res, Code.NOT_FOUND_OR_EXPIRED, 'Session has expired');
    });
  },
);
