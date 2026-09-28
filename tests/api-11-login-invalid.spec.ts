// API-11: checks that logging in with an email that has no account asks the customer to sign up.
import { test, about, Code } from '../src/fixtures';

test(
  'API-11 Customer login: an unknown user is asked to sign up',
  about(
    'Logging in with an email that has no account returns "User not found, Please signup". Uses a made-up user, so no real account is touched.',
    'The Account screen must guide unknown customers to register instead of failing silently.',
  ),
  async ({ kioskApi, verify }) => {
    // Try to log in with a made-up user on a reserved ".invalid" domain.
    const res = await kioskApi.post('customer/login', {
      userName: 'qa.automation.nouser@example.invalid',
      password: 'not-a-real-password',
    });

    // The backend must answer "User not found, Please signup" (code 12001).
    await test.step('Verify "User not found, Please signup" is returned', async () => {
      verify.answer(res, Code.DIALOG, 'User not found, Please signup');
    });
  },
);
