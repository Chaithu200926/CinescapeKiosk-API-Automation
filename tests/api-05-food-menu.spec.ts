import { test, about } from '../src/fixtures';
import { config } from '../src/config';

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
    const res = await kioskApi.post<{ concessionTabs: { concessionItems: ConcessionItem[] }[] }>('content/food/getfood', {
      cinemaId: config.cinemaId,
    });

    await test.step('Verify response is successful', async () => {
      verify.success(res);
    });

    await test.step('Verify every item has a positive KWD price', async () => {
      const items = res.body.output.concessionTabs.flatMap((tab) => tab.concessionItems);
      verify.greaterThan('Number of food items', items.length, 0);
      verify.equal(
        'Items without a positive price',
        items.filter((i) => !(i.priceInCents > 0)).map((i) => i.description),
        [],
      );
      // Single price ("KWD 2.000") or a range for sized items ("KWD 1.000 - 1.250").
      verify.equal(
        'Items with a badly formatted price label',
        items.filter((i) => !/^KWD \d+\.\d{3}( - \d+\.\d{3})?$/.test(i.itemPrice)).map((i) => `${i.description}: ${i.itemPrice}`),
        [],
      );
    });
  },
);
