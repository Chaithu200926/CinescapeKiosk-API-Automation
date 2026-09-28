## CinescapeKiosk API tests: 3/4 passed, 1 failed

**Run** #4 · **commit** `c263578` Add API-04 seat layout test · **by** Chaithu200926 · **trigger** published from QA PC  
**Machine** Local QA PC · **Node** v24.21.0 · **Playwright** 1.63.0 · **Cinema** 0000000001 · **Duration** 0.92s  
**Pass-rate trend** (oldest → newest): 100% → 50% → 67% → 75%  
**Dashboard:** https://chaithu200926.github.io/CinescapeKiosk-API-Automation/

| Test | Result | Last 10 runs | API call | HTTP | Code | Response message |
|---|---|---|---|---|---|---|
| API-01 Cinemas: kiosk cinema is listed and active | ✅ Passed | ✅✅✅✅ | `GET content/cinemas` | 200 | 10001 | (empty) |
| API-02 Sessions: today's programme loads for the kiosk cinema | ❌ Failed | ▫️❌❌❌ | `POST content/csessions` | 200 | 12002 | Something went wrong! |
| API-03 Ticket types: an expired session is rejected | ✅ Passed | ▫️▫️✅✅ | `GET content/trans/tickettype?cinemaId=0000000001&sessionId=0` | 200 | 11001 | Session has expired |
| API-04 Seat layout: an expired session is rejected | ✅ Passed | ▫️▫️▫️✅ | `GET content/trans/seatlayoutkiosk?cinemaId=0000000001&sessionId=0&areacode=0` | 200 | 11001 | Session has expired |

### Failed checks

| Test | Check | Expected | Actual |
|---|---|---|---|
| API-02 | Response code | `10001` | `12002` |

_All calls passed the read-only allowlist. Full request/response details are on the dashboard._
