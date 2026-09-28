// API-08: checks the club card top-up amounts shown on the Top Up screen.
import { test, about } from '../src/fixtures';

test(
  'API-08 Club card: top-up amounts are listed in ascending KWD',
  about(
    'The club card top-up amounts load as positive values in ascending order, each labelled "KWD n".',
    'The Top Up screen shows these buttons, and a wrong label would charge a different amount than shown.',
  ),
  async ({ kioskApi, verify }) => {
    // Ask for the list of top-up amounts.
    const res = await kioskApi.get<{ amounts: { amount: number; amountStr: string }[] }>('clubcard/getamounts');

    // The call must succeed (HTTP 200, code 10001).
    await test.step('Verify response is successful', async () => {
      verify.success(res);
    });

    // Check values, labels and order.
    await test.step('Verify amounts are positive, ascending and labelled "KWD n"', async () => {
      const amounts = res.body.output.amounts;
      verify.greaterThan('Number of top-up amounts', amounts.length, 0);
      // No zero or negative amounts.
      verify.equal('Non-positive amounts', amounts.filter((a) => a.amount <= 0).map((a) => a.amount), []);
      // Each label must match its amount, e.g. 5 → "KWD 5".
      verify.equal('Labels not matching "KWD n"', amounts.filter((a) => a.amountStr !== `KWD ${a.amount}`).map((a) => a.amountStr), []);
      // The list must already be sorted from smallest to largest.
      const values = amounts.map((a) => a.amount);
      verify.equal('Amounts in ascending order', values, [...values].sort((a, b) => a - b));
    });
  },
);
