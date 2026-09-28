// API-06: checks that the coming-soon films list loads (an empty list is allowed).
import { test, about, Code } from '../src/fixtures';
import { config } from '../src/config';

test(
  'API-06 Coming soon: list is returned',
  about(
    'The coming-soon films list loads, even when it is empty.',
    'The Coming Soon screen on the kiosk depends on this call.',
  ),
  async ({ kioskApi, verify }) => {
    // Ask for coming-soon films (POST only carries the cinema filter).
    const res = await kioskApi.post<unknown[]>('content/comingsoon', { cinemaId: config.cinemaId });

    // HTTP 200, code 10001, and the data must be a list.
    await test.step('Verify HTTP 200 with code 10001 and a list', async () => {
      verify.equal('HTTP status', res.status, 200);
      verify.equal('Response code', res.body.code, Code.SUCCESS);
      verify.equal('Output is a list', Array.isArray(res.body.output), true);
    });
  },
);
