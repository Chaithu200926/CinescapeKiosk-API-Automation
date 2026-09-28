## CinescapeKiosk API tests: 11/12 passed, 1 failed

**Run** #15 · **commit** `8eac07f` Show the full API URL (host hidden) for every call; hide the host in network errors · **by** Chaithu200926 · **trigger** published from QA PC  
**Machine** Local QA PC · **Node** v24.21.0 · **Playwright** 1.63.0 · **Cinema** 0000000001 · **Duration** 1.92s  
**Pass-rate trend** (oldest → newest): 83% → 86% → 88% → 89% → 90% → 91% → 92% → 92% → 92% → 92%  
**Dashboard:** https://chaithu200926.github.io/CinescapeKiosk-API-Automation/

| Test | Result | Last 10 runs | API call | HTTP | Code | Response message |
|---|---|---|---|---|---|---|
| API-01 Cinemas: kiosk cinema is listed and active | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/content/cinemas` | 200 | 10001 | (empty) |
| API-02 Sessions: today's programme lists the movies showing | ❌ Failed | ❌❌❌❌❌❌❌❌❌❌ | `POST http://<kiosk-api-host>:8090/api/content/csessions` | 200 | 12002 | Something went wrong! |
| API-03 Ticket types: an expired session is rejected | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/content/trans/tickettype?cinemaId=0000000001&sessionId=0` | 200 | 11001 | Session has expired |
| API-04 Seat layout: an expired session is rejected | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/content/trans/seatlayoutkiosk?cinemaId=0000000001&sessionId=0&areacode=0` | 200 | 11001 | Session has expired |
| API-05 Food menu: concession items are listed with prices | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `POST http://<kiosk-api-host>:8090/api/content/food/getfood` | 200 | 10001 | (empty) |
| API-06 Coming soon: list is returned | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `POST http://<kiosk-api-host>:8090/api/content/comingsoon` | 200 | 10001 | This is splash text |
| API-07 Email domains: common domains are offered | ✅ Passed | ▫️✅✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/content/email-domains` | 200 | 10001 | (empty) |
| API-08 Club card: top-up amounts are listed in ascending KWD | ✅ Passed | ▫️▫️✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/clubcard/getamounts` | 200 | 10001 | (empty) |
| API-09 Pickup: an unknown booking reference is not found | ✅ Passed | ▫️▫️▫️✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/history/kiosk/booking?cinemaId=0000000001&bookingReference=ZZZZ0000` | 200 | 11001 | Booking not found |
| API-10 KNET payment status: an unknown booking has no active booking | ✅ Passed | ▫️▫️▫️▫️✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/payment/knet/kiosk/status?trackId=0&bookingId=0` | 200 | 12020 | There are no active bookings. |
| API-11 Customer login: an unknown user is asked to sign up | ✅ Passed | ▫️▫️▫️▫️▫️✅✅✅✅✅ | `POST http://<kiosk-api-host>:8090/api/customer/login` | 200 | 12001 | User not found, Please signup |
| API-12 Security: requests without valid kiosk credentials are rejected | ✅ Passed | ▫️▫️▫️▫️▫️▫️✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/payment/knet/kiosk/status?trackId=0&bookingId=0` | 401 | 12002 | Kiosk key rejected |
|  |  |  | `GET http://<kiosk-api-host>:8090/api/payment/knet/kiosk/status?trackId=0&bookingId=0` | 401 | 12002 | Kiosk key rejected |
|  |  |  | `GET http://<kiosk-api-host>:8090/api/payment/knet/kiosk/status?trackId=0&bookingId=0` | 403 | 12002 | This endpoint is for configured kiosks only |

### API-02 · Movies now showing (0)

_No rows: the API returned no data for this table._

### Failed checks

| Test | Check | Expected | Actual |
|---|---|---|---|
| API-02 | Response code | `10001` | `12002` |

_All calls passed the read-only allowlist. Full request/response details are on the dashboard._
