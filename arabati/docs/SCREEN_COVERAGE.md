# Milestone 3 screen coverage

The PDF is a mobile prototype, not supplied React source. Phase 4 implements the same workflows and brand palette, adds wider layouts, and replaces the wireframe placeholders with original cart illustrations. The names and records are fictional demo content. One vendor account manages one cart. The application starts at `#/`.

| Screen | Implemented route or state | Working behavior | Source |
| --- | --- | --- | --- |
| M01 Discover | #/ | Event date/city/category/budget form, valid future date and clear filters | Discover.jsx |
| M02 Search and map | #/ → Find my cart; List/Map | Matching results, sorting, 20-card pages, same cart IDs in list/map, fallback pins and empty state | Discover.jsx; CartMap.jsx |
| M03 Cart profile | #/cart/:id | Package selection, menu/reviews, rating, service cities, date availability and report | Discover.jsx |
| M04 Sign in | #/signin | Credentials, generic errors, retry limit, role demo entry and redirect | Auth.jsx |
| M05 Registration | #/register | Customer/vendor only, unique valid email, Saudi mobile, 12-character password and terms | Auth.jsx |
| M06 Booking form | #/request/:cartId | Required event fields, capacity, budget, duration, duplicate and availability checks | Bookings.jsx |
| M07 Confirmation | #/confirmation/:bookingId | Saved reference, actual current status and track action | Bookings.jsx |
| M08 Booking list | #/bookings | Owned records, upcoming/past/all, status filters and detail links | Bookings.jsx |
| M09 Booking detail | #/booking/:id | Package snapshot, venue, event time, timeline, eligible cancellation and contact | Bookings.jsx |
| M10 Verified review | #/review/:bookingId | Completed owner only, one review, 1–5 stars, 10–1,000 characters and recalculated average | Bookings.jsx |
| M11 Account | #/account | Name/mobile validation, current-password check, new password and logout; role read only | Account.jsx |
| M12 Vendor dashboard | #/vendor | Own request/event groups and derived counts; completed history | Vendor.jsx |
| M13 Listing editor | #/listing | Profile/menu/package tabs, add/edit/remove rows, image type/size checks, cities, drafts and submission | Vendor.jsx |
| M14 Calendar | #/calendar | Correct month grid, previous/next, selected date, blocks, locked accepted dates and pending-conflict warning | Vendor.jsx |
| M15 Vendor decision | #/vendor/request/:id | Owned pending accept/decline with note; serialized recheck, contact and completion after end | Vendor.jsx |
| M16 Admin overview | #/admin | Live application/report/suspension/booking counts and recent audit entries | Admin.jsx |
| M17 Verification | #/applications and #/application/:id | Profile/menu/package/city inspection, approval checklist, rejection reason and audit | Admin.jsx |
| M18 Moderation | #/moderation | Search, Open/Resolved, private evidence, hide/dismiss/suspend and resolution history | Admin.jsx |
| M19 Notifications/contact | #/alerts and contact dialog | Owned alerts, unread filter, mark read/all, record links and explicit WhatsApp draft | Account.jsx; Bookings.jsx |
| M20 Records/status | #/records and #/oversight/:id | Users/listings/bookings, search/status/role/date filters, 20-record pages, suspend/restore and read-only oversight | Admin.jsx; Bookings.jsx |
| S01 Cancel sheet | Booking detail → Cancel booking | Reason, confirmation, state/start/owner recheck and release | CancellationDialog |
| S02 Report sheet | Cart/review → Report | Valid target, reason, private 20–1,000 character evidence and duplicate-open protection | ReportDialog |
| S03 Recovery sheet | Sign in → Forgot password | Generic response, explicit demo reset link, 30-minute expiry, matching passwords and one use | RecoveryDialog; ResetPassword |
| S04 Feedback variants | Search, forms, calendar and decisions | Distinct empty/conflict/provider messages, no destructive clearing and retry guidance | Shared notices and RuleError |

## Functional requirements

| Requirement group | Coverage |
| --- | --- |
| G01 | Approved active public discovery; protected actions lead to sign-in |
| A01–A04 | Auth forms, simulated sessions/recovery, account settings and logout |
| C01–C07 | Event search, map/list, profiles/packages, requests, tracking, cancellation and reviews |
| V01–V06 | Listing/menu/packages, cities, availability, dashboard, decisions and completion |
| N01 | Saved in-app alerts and manually opened contact draft; email remains a documented integration |
| R01 | Authenticated content reports with private evidence and duplicate checks |
| D01–D06 | Verification, reversible moderation, reports/resolutions, oversight and records |

## Adopted implementation details

- Event dates start from tomorrow. This is a clear interpretation of “future date” and avoids partially elapsed same-day bookings.
- Requested duration must be greater than zero and no longer than the selected package’s included service hours, with a maximum listing package duration of 24 hours.
- An accepted event reserves the full Asia/Riyadh start date. Pending requests do not reserve it. Blocking or accepting updates competing Pending requests to Declined.
- Suspension preserves prior bookings and approval status. Restoring a pending/rejected listing cannot make it public.
- Booked package name, price, capacity and hours are snapshots. Later listing edits cannot change earlier bookings.
- Public ratings use visible reviews only. Review and report content is displayed as text.
- Map coordinates are illustrative service-area locations, not real vendor addresses. All pins resolve to the same cart IDs as cards. Schematic fallback pins remain interactive without a provider.
- Native dialogs serve as centred desktop dialogs and compact phone dialogs rather than reproducing a static bottom-sheet screenshot.
