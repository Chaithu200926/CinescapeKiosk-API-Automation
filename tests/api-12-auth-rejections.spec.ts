// API-12: checks that kiosk-only endpoints reject requests without valid kiosk credentials.
import { test, about, Code } from '../src/fixtures';

// A kiosk-only, read-only endpoint used for all three checks.
const endpoint = 'payment/knet/kiosk/status?trackId=0&bookingId=0';

test(
  'API-12 Security: requests without valid kiosk credentials are rejected',
  about(
    'Kiosk-only endpoints reject a missing key, a wrong key, and a missing "platform: KIOSK" header.',
    'Stops anyone on the network from calling kiosk payment endpoints. Also documents the 403 the real kiosks hit when the platform header is missing.',
  ),
  async ({ kioskApi, verify }) => {
    // Check 1: remove the X-Kiosk-Key header entirely.
    await test.step('Missing kiosk key → 401 "Kiosk key rejected"', async () => {
      const res = await kioskApi.get(endpoint, { headers: { 'X-Kiosk-Key': undefined } });
      verify.equal('No key: HTTP status', res.status, 401);
      verify.equal('No key: response code', res.body.code, Code.ERROR);
      verify.equal('No key: response message', res.body.msg, 'Kiosk key rejected');
    });

    // Check 2: send a wrong kiosk key.
    await test.step('Wrong kiosk key → 401 "Kiosk key rejected"', async () => {
      const res = await kioskApi.get(endpoint, { headers: { 'X-Kiosk-Key': 'invalid-key-for-automation' } });
      verify.equal('Wrong key: HTTP status', res.status, 401);
      verify.equal('Wrong key: response message', res.body.msg, 'Kiosk key rejected');
    });

    // Check 3: keep the key but remove the "platform: KIOSK" header.
    await test.step('Missing platform header → 403 "configured kiosks only"', async () => {
      const res = await kioskApi.get(endpoint, { headers: { platform: undefined } });
      verify.equal('No platform header: HTTP status', res.status, 403);
      verify.equal('No platform header: response message', res.body.msg, 'This endpoint is for configured kiosks only');
    });
  },
);
