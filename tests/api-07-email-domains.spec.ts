// API-07: checks the quick-pick email domains shown on the kiosk keyboard.
import { test, about } from '../src/fixtures';

test(
  'API-07 Email domains: common domains are offered',
  about(
    'The quick-pick email domains used on the kiosk keyboard load, include @gmail.com and are well formed.',
    'Customers use these buttons to type their email faster when receiving tickets by email.',
  ),
  async ({ kioskApi, verify }) => {
    // Ask for the email domain list.
    const res = await kioskApi.get<{ EmailCode: string; ExtensionName: string }[]>('content/email-domains');

    // The call must succeed (HTTP 200, code 10001).
    await test.step('Verify response is successful', async () => {
      verify.success(res);
    });

    // @gmail.com must be offered, and every entry must look like "@name.tld".
    await test.step('Verify @gmail.com is offered and every domain starts with @', async () => {
      const domains = res.body.output.map((d) => d.ExtensionName);
      verify.contains('Domains offered', domains, '@gmail.com');
      verify.equal('Badly formatted domains', domains.filter((d) => !/^@[a-z0-9.-]+\.[a-z]+$/i.test(d)), []);
    });
  },
);
