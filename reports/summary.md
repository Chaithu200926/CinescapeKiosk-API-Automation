## CinescapeKiosk API tests: 1/2 passed, 1 failed

**Run** #2 · **commit** `ca3d8da` Add API-02 sessions test · **by** Chaithu200926 · **trigger** published from QA PC  
**Machine** Local QA PC · **Node** v24.21.0 · **Playwright** 1.63.0 · **Cinema** 0000000001 · **Duration** 0.49s  
**Pass-rate trend** (oldest → newest): 100% → 50%  
**Dashboard:** https://chaithu200926.github.io/CinescapeKiosk-API-Automation/

| Test | Result | Last 10 runs | API call | HTTP | Code | Response message |
|---|---|---|---|---|---|---|
| API-01 Cinemas: kiosk cinema is listed and active | ✅ Passed | ✅✅ | `GET content/cinemas` | 200 | 10001 | (empty) |
| API-02 Sessions: today's programme loads for the kiosk cinema | ❌ Failed | ▫️❌ | `POST content/csessions` | 200 | 12002 | Something went wrong! |

### Failed checks

| Test | Check | Expected | Actual |
|---|---|---|---|
| API-02 | Response code | `10001` | `12002` |

_All calls passed the read-only allowlist. Full request/response details are on the dashboard._
