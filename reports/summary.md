## CinescapeKiosk API tests: 11/12 passed, 1 failed

**Run** #12 · **commit** `9c8ff96` Add API-12 auth rejections test · **by** Chaithu200926 · **trigger** published from QA PC  
**Machine** Local QA PC · **Node** v24.21.0 · **Playwright** 1.63.0 · **Cinema** 0000000001 · **Duration** 1.68s  
**Pass-rate trend** (oldest → newest): 67% → 75% → 80% → 83% → 86% → 88% → 89% → 90% → 91% → 92%  
**Dashboard:** https://chaithu200926.github.io/CinescapeKiosk-API-Automation/

| Test | Result | Last 10 runs | API call | HTTP | Code | Response message |
|---|---|---|---|---|---|---|
| API-01 Cinemas: kiosk cinema is listed and active | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `GET content/cinemas` | 200 | 10001 | (empty) |
| API-02 Sessions: today's programme loads for the kiosk cinema | ❌ Failed | ❌❌❌❌❌❌❌❌❌❌ | `POST content/csessions` | 200 | 12002 | Something went wrong! |
| API-03 Ticket types: an expired session is rejected | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `GET content/trans/tickettype?cinemaId=0000000001&sessionId=0` | 200 | 11001 | Session has expired |
| API-04 Seat layout: an expired session is rejected | ✅ Passed | ▫️✅✅✅✅✅✅✅✅✅ | `GET content/trans/seatlayoutkiosk?cinemaId=0000000001&sessionId=0&areacode=0` | 200 | 11001 | Session has expired |
| API-05 Food menu: concession items are listed with prices | ✅ Passed | ▫️▫️✅✅✅✅✅✅✅✅ | `POST content/food/getfood` | 200 | 10001 | (empty) |
| API-06 Coming soon: list is returned | ✅ Passed | ▫️▫️▫️✅✅✅✅✅✅✅ | `POST content/comingsoon` | 200 | 10001 | This is splash text |
| API-07 Email domains: common domains are offered | ✅ Passed | ▫️▫️▫️▫️✅✅✅✅✅✅ | `GET content/email-domains` | 200 | 10001 | (empty) |
| API-08 Club card: top-up amounts are listed in ascending KWD | ✅ Passed | ▫️▫️▫️▫️▫️✅✅✅✅✅ | `GET clubcard/getamounts` | 200 | 10001 | (empty) |
| API-09 Pickup: an unknown booking reference is not found | ✅ Passed | ▫️▫️▫️▫️▫️▫️✅✅✅✅ | `GET history/kiosk/booking?cinemaId=0000000001&bookingReference=ZZZZ0000` | 200 | 11001 | Booking not found |
| API-10 KNET payment status: an unknown booking has no active booking | ✅ Passed | ▫️▫️▫️▫️▫️▫️▫️✅✅✅ | `GET payment/knet/kiosk/status?trackId=0&bookingId=0` | 200 | 12020 | There are no active bookings. |
| API-11 Customer login: an unknown user is asked to sign up | ✅ Passed | ▫️▫️▫️▫️▫️▫️▫️▫️✅✅ | `POST customer/login` | 200 | 12001 | User not found, Please signup |
| API-12 Security: requests without valid kiosk credentials are rejected | ✅ Passed | ▫️▫️▫️▫️▫️▫️▫️▫️▫️✅ | `GET payment/knet/kiosk/status?trackId=0&bookingId=0` | 401 | 12002 | Kiosk key rejected |
|  |  |  | `GET payment/knet/kiosk/status?trackId=0&bookingId=0` | 401 | 12002 | Kiosk key rejected |
|  |  |  | `GET payment/knet/kiosk/status?trackId=0&bookingId=0` | 403 | 12002 | This endpoint is for configured kiosks only |

### Failed checks

| Test | Check | Expected | Actual |
|---|---|---|---|
| API-02 | Response code | `10001` | `12002` |

_All calls passed the read-only allowlist. Full request/response details are on the dashboard._
