// API-02: loads today's programme and lists every movie showing, with its showtimes.
import { test, about, showTable } from '../src/fixtures';
import { config } from '../src/config';
import { extractMovies } from '../src/programme';

test(
  "API-02 Sessions: today's programme lists the movies showing",
  about(
    "Today's programme loads for the kiosk cinema and contains at least one movie with a showtime. Every movie found is listed with its certification, running time, experiences, showtimes and screens.",
    'Without the programme, customers cannot choose a film or showtime, so no tickets can be sold.',
  ),
  async ({ kioskApi, verify }, testInfo) => {
    // Today's date in the yyyy-MM-dd format the kiosk app sends.
    const today = new Date().toISOString().slice(0, 10);

    // Ask for today's programme with no filters, exactly like the kiosk's Films screen.
    const res = await kioskApi.post('content/csessions', {
      cinemaId: config.cinemaId,
      dated: today,
      experience: '',
      language: '',
      rating: '',
      genre: '',
    });

    // Pull the movies out of the answer and publish them as a table on the dashboard
    // (published first, so the dashboard shows "0 movies" even when the call fails).
    const movies = extractMovies(res.body.output);
    await test.step('List the movies showing today', async () => {
      await showTable(testInfo, 'Movies now showing', ['Movie', 'Certification', 'Running time', 'Experiences', 'Showtimes', 'Screens'],
        movies.map((m) => [m.title, m.certification, m.runTime, m.experiences.join(', '), m.showtimes.join(', '), m.screens.join(', ')]),
      );
    });

    // The backend must answer with success.
    await test.step('Verify response is successful', async () => {
      verify.success(res);
    });

    // At least one movie, and every movie must have a showtime.
    await test.step('Verify movies with showtimes are returned', async () => {
      verify.greaterThan('Movies showing today', movies.length, 0);
      verify.equal('Movies without any showtime', movies.filter((m) => m.showtimes.length === 0).map((m) => m.title), []);
    });
  },
);
