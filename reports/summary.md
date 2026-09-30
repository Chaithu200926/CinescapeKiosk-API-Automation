## CinescapeKiosk API tests: 12/12 passed

**Run** #16 · **commit** `9216f90` Fix API-02: send the programme request as the kiosk app does and read its daySessions answer · **by** Chaithu200926 · **trigger** published from QA PC  
**Machine** Local QA PC · **Node** v24.21.0 · **Playwright** 1.63.0 · **Cinema** 0000000001 · **Duration** 1.26s  
**Pass-rate trend** (oldest → newest): 86% → 88% → 89% → 90% → 91% → 92% → 92% → 92% → 92% → 100%  
**Dashboard:** https://chaithu200926.github.io/CinescapeKiosk-API-Automation/

| Test | Result | Last 10 runs | API call | HTTP | Code | Response message |
|---|---|---|---|---|---|---|
| API-01 Cinemas: kiosk cinema is listed and active | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/content/cinemas` | 200 | 10001 | (empty) |
| API-02 Sessions: today's programme lists the movies showing | ✅ Passed | ❌❌❌❌❌❌❌❌❌✅ | `POST http://<kiosk-api-host>:8090/api/content/csessions` | 200 | 10001 | (empty) |
| API-03 Ticket types: an expired session is rejected | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/content/trans/tickettype?cinemaId=0000000001&sessionId=0` | 200 | 11001 | Session has expired |
| API-04 Seat layout: an expired session is rejected | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/content/trans/seatlayoutkiosk?cinemaId=0000000001&sessionId=0&areacode=0` | 200 | 11001 | Session has expired |
| API-05 Food menu: concession items are listed with prices | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `POST http://<kiosk-api-host>:8090/api/content/food/getfood` | 200 | 10001 | (empty) |
| API-06 Coming soon: list is returned | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `POST http://<kiosk-api-host>:8090/api/content/comingsoon` | 200 | 10001 | This is splash text |
| API-07 Email domains: common domains are offered | ✅ Passed | ✅✅✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/content/email-domains` | 200 | 10001 | (empty) |
| API-08 Club card: top-up amounts are listed in ascending KWD | ✅ Passed | ▫️✅✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/clubcard/getamounts` | 200 | 10001 | (empty) |
| API-09 Pickup: an unknown booking reference is not found | ✅ Passed | ▫️▫️✅✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/history/kiosk/booking?cinemaId=0000000001&bookingReference=ZZZZ0000` | 200 | 11001 | Booking not found |
| API-10 KNET payment status: an unknown booking has no active booking | ✅ Passed | ▫️▫️▫️✅✅✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/payment/knet/kiosk/status?trackId=0&bookingId=0` | 200 | 12020 | There are no active bookings. |
| API-11 Customer login: an unknown user is asked to sign up | ✅ Passed | ▫️▫️▫️▫️✅✅✅✅✅✅ | `POST http://<kiosk-api-host>:8090/api/customer/login` | 200 | 12001 | User not found, Please signup |
| API-12 Security: requests without valid kiosk credentials are rejected | ✅ Passed | ▫️▫️▫️▫️▫️✅✅✅✅✅ | `GET http://<kiosk-api-host>:8090/api/payment/knet/kiosk/status?trackId=0&bookingId=0` | 401 | 12002 | Kiosk key rejected |
|  |  |  | `GET http://<kiosk-api-host>:8090/api/payment/knet/kiosk/status?trackId=0&bookingId=0` | 401 | 12002 | Kiosk key rejected |
|  |  |  | `GET http://<kiosk-api-host>:8090/api/payment/knet/kiosk/status?trackId=0&bookingId=0` | 403 | 12002 | This endpoint is for configured kiosks only |

### API-02 · Movies now showing (23)

| Movie | Certification | Running time | Experiences | Showtimes | Screens |
|---|---|---|---|---|---|
| Unit 234 | G | 1 hr 26 min | Standard | 2026-09-30 11:45, 2026-09-30 16:45, 2026-09-30 21:30, 2026-09-30 00:20 | Screen 11, Screen 7 |
| Subservience | PG12 | 1 hr 46 min | Standard, VIP | 2026-09-30 14:15, 2026-09-30 19:00, 2026-09-30 23:45, 2026-09-30 12:30, 2026-09-30 13:30, 2026-09-30 15:55 | Screen 11, Screen 4, Screen 9 |
| Despicable Me 4 | PG15 | 1 hr 34 min | 4DX, Standard | 2026-09-30 13:45, 2026-09-30 18:35, 2026-09-30 15:30, 2026-09-30 20:00, 2026-09-30 22:10 | Screen 15, Screen 7 |
| Hounds of War | PG12 | 1 hr 34 min | Standard | 2026-09-30 11:35, 2026-09-30 21:50, 2026-09-30 00:00 | Screen 5 |
| Blink Twice | R18 | 1 hr 42 min | Standard | 2026-09-30 17:15 | Screen 12 |
| Harold and the Purple Crayon | PG15 | 1 hr 30 min | Standard | 2026-09-30 16:50, 2026-09-30 19:05 | Screen 3 |
| Speak No Evil | R18 | 1 hr 46 min | VIP, Standard | 2026-09-30 12:40, 2026-09-30 15:05, 2026-09-30 22:30, 2026-09-30 13:15, 2026-09-30 15:45, 2026-09-30 18:15, 2026-09-30 20:45, 2026-09-30 23:15 | Screen 10, Screen 13 |
| Alien: Romulus | R18 | 1 hr 58 min | Standard | 2026-09-30 21:10, 2026-09-30 23:50 | Screen 6 |
| AFRAID | R15 | 1 hr 20 min | Standard | 2026-09-30 14:10, 2026-09-30 22:35 | Screen 6, Screen 2 |
| It Ends with Us | R18 | 1 hr 57 min | Standard, VIP | 2026-09-30 13:50, 2026-09-30 16:30, 2026-09-30 19:15, 2026-09-30 19:55 | Screen 5, Screen 10 |
| Wake Up | G | 1 hr 20 min | Standard | 2026-09-30 12:20, 2026-09-30 20:35, 2026-09-30 00:40 | Screen 3, Screen 2 |
| The Buckingham Murders - Hindi | PG15 | 1 hr 46 min | Standard | 2026-09-30 11:25, 2026-09-30 16:10, 2026-09-30 18:45 | Screen 6 |
| Al Khatar Maehom 4 Part Two  (Kuwaiti) - Arabic | T13+ | 1 hr 56 min | Standard | 2026-09-30 20:05 | Screen 14 |
| Deadpool & Wolverine | R18 | 2 hr 3 min | Standard | 2026-09-30 17:05 | Screen 14 |
| Gracie and Pedro: Pets to the Rescue | PG15 | 1 hr 27 min | Standard | 2026-09-30 13:25, 2026-09-30 17:45 | Screen 7 |
| Beetlejuice Beetlejuice | T13+ | 1 hr 44 min | 4DX, DOLBY, VIP | 2026-09-30 11:15, 2026-09-30 16:00, 2026-09-30 20:50, 2026-09-30 23:10, 2026-09-30 19:30, 2026-09-30 22:00, 2026-09-30 00:30, 2026-09-30 12:00, 2026-09-30 14:30, 2026-09-30 17:00, 2026-09-30 17:30 | Screen 15, Screen 1, Screen 10 |
| The Clean Up Crew | PG12 | 1 hr 34 min | Standard | 2026-09-30 13:00, 2026-09-30 14:50, 2026-09-30 18:00, 2026-09-30 23:00, 2026-09-30 01:25 | Screen 8, Screen 14 |
| The Jungle Bunch: World Tour | PG | 1 hr 29 min | Standard | 2026-09-30 11:50, 2026-09-30 16:15, 2026-09-30 18:30 | Screen 2 |
| Lee | R18 | 1 hr 57 min | Standard, VIP | 2026-09-30 12:05, 2026-09-30 15:15, 2026-09-30 20:15, 2026-09-30 22:45, 2026-09-30 18:20, 2026-09-30 21:05, 2026-09-30 23:40 | Screen 14, Screen 8, Screen 9 |
| Akh (Kuwaiti) - Arabic  | R15 | 2 hr 17 min | Standard | 2026-09-30 15:00, 2026-09-30 18:05, 2026-09-30 21:00, 2026-09-30 00:00 | Screen 4 |
| Inside Out 2 | PG12 | 1 hr 36 min | Standard | 2026-09-30 14:00 | Screen 2 |
| Ex Merati (Egyptian) - Arabic | R15 | 1 hr 53 min | Standard | 2026-09-30 12:15, 2026-09-30 14:45, 2026-09-30 19:45, 2026-09-30 22:15, 2026-09-30 00:45 | Screen 12 |
| Trap | PG | 1 hr 45 min | Standard | 2026-09-30 14:25, 2026-09-30 21:15, 2026-09-30 23:35 | Screen 3 |

_All calls passed the read-only allowlist. Full request/response details are on the dashboard._
