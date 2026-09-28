// API-05: checks that the food & beverage menu loads and every item has a valid KWD price.
import { test, about } from '../src/fixtures';
import { config } from '../src/config';

// Fields of a menu item that this test reads.
interface ConcessionItem {
  id: string;
  description: string;
  priceInCents: number;
  itemPrice: string;
}

test(
  'API-05 Food menu: concession items are listed with prices',
  about(
    'The food & beverage menu loads, and every item has a positive price shown in KWD.',
    'A missing or zero price would let customers order food for free or block the food screen.',
  ),
  async ({ kioskApi, verify }) => {
    // Ask for the kiosk cinema's food menu (POST only carries the cinema filter).
    const res = await kioskApi.post<{ concessionTabs: { concessionItems: ConcessionItem[] }[] }>('content/food/getfood', {
      cinemaId: config.cinemaId,
    });

    // The call must succeed (HTTP 200, code 10001).
    await test.step('Verify response is successful', async () => {
      verify.success(res);
    });

    // Check every item on every menu tab.
    await test.step('Verify every item has a positive KWD price', async () => {
      // Flatten all tabs into one list of items.
      const items = res.body.output.concessionTabs.flatMap((tab) => tab.concessionItems);
      verify.greaterThan('Number of food items', items.length, 0);
      // No item may have a zero or missing price.
      verify.equal(
        'Items without a positive price',
        items.filter((i) => !(i.priceInCents > 0)).map((i) => i.description),
        [],
      );
      // Price label: single price ("KWD 2.000") or a range for sized items ("KWD 1.000 - 1.250").
      verify.equal(
        'Items with a badly formatted price label',
        items.filter((i) => !/^KWD \d+\.\d{3}( - \d+\.\d{3})?$/.test(i.itemPrice)).map((i) => `${i.description}: ${i.itemPrice}`),
        [],
      );
    });
  },
);
