# CinescapeKiosk API Automation

Playwright API tests for the backend used by the CinescapeKiosk Windows kiosk app.
One test case per file in [`tests/`](tests). All tests are **read-only**: they only
read data or send requests that are expected to be rejected, so nothing changes on the backend.

## How it runs

The kiosk API is on a private office address, so GitHub's cloud machines cannot reach it.

**Current mode: run on the QA PC, publish to GitHub**

```bash
npm run publish-results -- "Add API-13 <name> test"
```

This one command:
1. Commits your test/code changes with that message.
2. Runs all tests on this PC.
3. Builds the dashboard into [`reports/`](reports) and commits it.
4. Pushes to `main`.

The push triggers [`publish-dashboard.yml`](.github/workflows/publish-dashboard.yml) on GitHub, which:
- shows the results table on the **Actions** run page,
- deploys the dashboard to **GitHub Pages**,
- marks the run ❌ if any test failed.

**Future mode: self-hosted runner** ([`api-tests.yml`](.github/workflows/api-tests.yml), manual only for now)

Windows Device Guard currently blocks the GitHub runner on the QA PC. Once IT allows
`C:\actions-runner\bin\Runner.Listener.exe`, register the runner with the label `kiosk-api` and
add the `push` trigger described in that file. GitHub then runs the tests itself on every push.

**Where results appear**
- **GitHub Pages dashboard:** every test, every API call, HTTP status and the API's response message.
- **The Actions run page:** a summary table with the same response messages.
- **[`reports/`](reports) in the repo:** the dashboard, `summary.md`, `results.json`, run history
  and the full Playwright HTML report.

## Read-only safeguard

[`src/safety.ts`](src/safety.ts) holds an allowlist of read-only endpoints. The API client refuses
any other method or endpoint **before the request is sent**, for example `reserveseats`,
`knet/kiosk/confirm`, `customer/register` or `customer/getOtp`. The few POST calls in the suite are
lookups (POST only carries the filters) or a login attempt with a made-up user.

## What the dashboard shows

- **Summary tiles:** tests, passed, failed, skipped, pass rate, API calls, duration
- **Trend chart:** passed/failed/skipped per run for the last 30 runs (hover for details)
- **Run & environment:** run number, commit and message, who pushed, branch, trigger, start/end time,
  machine, OS, Node.js/Playwright versions, target API (host hidden), cinema ID
- **Overview table:** each test's result, HTTP status, response message and its last 10 runs
- **Per test:** what it checks, why it matters, a check/expected/actual table, and for every API call
  the read-only label, HTTP status, time, size, response message/code/result, request and response
  headers, request body and full response body

History is kept in `reports/history.json` (committed), `KIOSK_HISTORY_FILE` (self-hosted runner) or
`dashboard/history.json` (local runs with `npm run dashboard`).

## Configuration

Connection settings come from environment variables. They are never committed.

| Variable | Meaning |
|---|---|
| `KIOSK_API_BASE_URL` | Kiosk API base, e.g. `http://<host>:8090/api/` |
| `KIOSK_API_KEY` | Kiosk key, sent as the `X-Kiosk-Key` header |
| `KIOSK_CINEMA_ID` | Cinema the kiosk is configured for (default `0000000001`) |
| `KIOSK_APP_VERSION` | Value for the `appversion` header (default `1.0.0`) |
| `KIOSK_HISTORY_FILE` | Where run history is kept for the trend chart (runner only) |

- **Local runs:** copy `.env.example` to `.env` and fill it in.
- **Runner:** put the same lines in the `.env` file in the runner's install folder, then restart the runner.

## Run locally

```bash
npm ci
npx playwright test          # run all tests
npm run dashboard            # build dashboard/index.html
```

## Request headers

The kiosk app sends these on every call, and the tests do the same (see [`src/config.ts`](src/config.ts)):

| Header | Value |
|---|---|
| `X-Kiosk-Key` | kiosk key |
| `platform` | `KIOSK` |
| `appversion` | app version |

Without `platform: KIOSK`, the kiosk-only endpoints answer
`403 "This endpoint is for configured kiosks only"`.

## Adding a test

1. Create `tests/api-NN-<name>.spec.ts`.
2. Describe it with `about(purpose, why)` from [`src/fixtures.ts`](src/fixtures.ts).
3. Call the API with `kioskApi.get()` / `kioskApi.post()`. Every call is checked against the
   read-only allowlist, logged and attached to the report automatically.
4. Assert with the `verify` fixture (`verify.success(res)`, `verify.answer(res, code, msg)`,
   `verify.equal(...)` and so on) so each check appears with its expected and actual value.
