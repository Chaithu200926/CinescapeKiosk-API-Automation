// API-01: checks that the kiosk's own cinema is in the cinema list, active and priced in KWD.
import { test, about } from '../src/fixtures';
import { config } from '../src/config';

// Fields of a cinema that this test reads.
interface Cinema {
  id: string;
  name: string;
  active: boolean;
  currencyCode: string;
}

test(
  'API-01 Cinemas: kiosk cinema is listed and active',
  about(
    'The cinema list contains the cinema this kiosk is configured for, and it is active and priced in KWD.',
    'The kiosk cannot start selling if its cinema is missing or inactive.',
  ),
  async ({ kioskApi, verify }) => {
    // Ask the backend for all cinemas.
    const res = await kioskApi.get<{ cinemas: Cinema[] }>('content/cinemas');

    // The call must succeed (HTTP 200, code 10001).
    await test.step('Verify response is successful', async () => {
      verify.success(res);
    });

    // Find the kiosk's cinema and check its details.
    await test.step('Verify the kiosk cinema is listed, active and priced in KWD', async () => {
      const cinemas = res.body.output.cinemas;
      verify.greaterThan('Number of cinemas', cinemas.length, 0);
      const cinema = cinemas.find((c) => c.id === config.cinemaId);
      verify.isTrue(`Cinema ${config.cinemaId} is in the list`, !!cinema, 'present', cinemas.map((c) => c.id));
      verify.equal('Cinema is active', cinema!.active, true);
      verify.equal('Currency', cinema!.currencyCode, 'KWD');
      verify.isTrue('Cinema has a name', cinema!.name.length > 0, 'non-empty', cinema!.name);
    });
  },
);
