import { test, about } from '../src/fixtures';
import { config } from '../src/config';

test(
  "API-02 Sessions: today's programme loads for the kiosk cinema",
  about(
    "Today's programme (films and showtimes) loads for the kiosk cinema.",
    'Without the programme, customers cannot choose a film or showtime, so no tickets can be sold.',
  ),
  async ({ kioskApi, verify }) => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await kioskApi.post('content/csessions', {
      cinemaId: config.cinemaId,
      dated: today,
      experience: '',
      language: '',
      rating: '',
      genre: '',
    });

    await test.step('Verify response is successful', async () => {
      verify.success(res);
    });

    await test.step('Verify the programme contains data', async () => {
      verify.isTrue('Programme output is present', !!res.body.output, 'not empty', res.body.output);
    });
  },
);
