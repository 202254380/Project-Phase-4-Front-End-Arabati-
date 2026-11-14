# Front-end architecture and integration contract

## State and rendering

`App.jsx` resolves hash routes. `Shell.jsx` owns the shared header, footer, mobile navigation and global dialogs. Page components collect user input and call `run(action, payload)` through `AppContext`.

`rules.js` contains validation and pure selectors. `repository.js` copies the latest state, checks the signed-in role/ownership and current record state, applies a transition, appends history/alerts/audit, then saves the new state. UI errors preserve form inputs. Database-like writes use one local transaction when Web Locks is available; storage events refresh other tabs’ data. Sessions are tab-scoped and carry a user session version so a reset/change invalidates older sessions in the demo.

Local storage key: `arabati.phase4.v1`. Session key: `arabati.session.v1`. Filter state: `arabati.filters`. A storage quota failure leaves the previous saved state intact and asks the user to remove the uploaded image. If storage is unavailable, the application uses session memory with a visible warning. Use a local server or HTTPS for password-related browser crypto.

## Main records

| Record | Key fields |
| --- | --- |
| User | id, name, email, mobile, role, status, sessionVersion, local password salt/hash |
| Cart | id, vendorId, name, category, baseCity, cities, status, suspended, menu, packages, blockedDates, optional photo |
| Booking | id, customerId, vendorId, cartId, cartName, date/time, city/venue, guests, duration, budget, package snapshot, status, history |
| Review | id, cartId, bookingId, customerId, rating, text, hidden |
| Report | id, reporterId, targetType/id, cartId, private details and content snapshot, status, resolution |
| Notification | id, userId, title/body, related record, read, timestamp |
| Audit | actorId/name, action, target, reason, timestamp |

## Status transitions

| Current state | Actor/action | Result and invariant |
| --- | --- | --- |
| Pending | Owning vendor accepts a free future date | Accepted; full date reserved; other pending requests on the same cart/date declined |
| Pending | Owning vendor declines | Declined; date stays unreserved |
| Pending or Accepted | Owning customer cancels before start with reason | Cancelled; accepted reservation released; history kept |
| Accepted | Owning vendor completes after end | Completed; customer may review once |
| Declined/Cancelled/Completed | Participant status action | Rejected; terminal history preserved |
| Available future date | Owning vendor blocks | Blocked; competing Pending requests declined |
| Blocked future date | Owning vendor removes block | Available if not reserved; declined requests stay declined |

All monetary values use SAR. Date grouping uses Asia/Riyadh. Demo data uses dynamic relative dates so sample future/historical states stay useful after a reset.

## Express and MongoDB handoff

Replace the browser transaction adapter with HTTP calls while preserving page components and domain validation. The server must independently enforce every rule; client validation is only for feedback. The following endpoints are an implementation contract, **not currently running APIs**.

| Method and path | Role and purpose | Required server behavior |
| --- | --- | --- |
| GET /api/carts | Public filtered discovery | Approved/active only, city/date/category/budget, cursor/20 results |
| GET /api/carts/:id | Public active profile | Safe fields only, packages, visible reviews and availability |
| POST /api/auth/register | Customer/vendor signup | Unique normalized email, valid Saudi mobile, adaptive salted server hash |
| POST /api/auth/login | Session creation | Generic failure, account/IP throttling, secure HttpOnly cookie |
| POST /api/auth/logout | Authenticated logout | Invalidate session |
| POST /api/auth/password-reset | Public reset request | Generic acknowledgement, emailed single-use 30-minute token |
| PUT /api/auth/password-reset | Valid token reset | Check token/expiry, new hash, invalidate sessions |
| PATCH /api/me | Signed-in profile | Validate owned name/mobile; role/email changes excluded |
| PUT /api/me/password | Signed-in password | Check current password; invalidate sessions |
| POST /api/bookings | Customer request | Recheck listing/package/date/capacity, duplicate/idempotency check, saved snapshot |
| GET /api/bookings and /:id | Participant or admin | Enforce ownership; admins receive read-only oversight |
| PATCH /api/bookings/:id/decision | Owning vendor | Atomic reservation uniqueness, competing declines, history and notifications |
| PATCH /api/bookings/:id/cancel | Owning customer | Eligible future state/reason; release reservation atomically |
| PATCH /api/bookings/:id/complete | Owning vendor | Accepted and end passed |
| POST /api/bookings/:id/review | Owning customer | Completed, unique booking review, length/rating validation |
| PUT /api/vendor/listing | Owning vendor | Validate fields/cities/images; preserve booking snapshots; pending verification for new listing |
| PUT /api/vendor/availability/:date | Owning vendor | Reject past/accepted dates; consistent competing request updates |
| GET/PATCH /api/notifications | Owner only | List/read own alerts, 20-record pages |
| POST /api/reports | Authenticated user | Valid content target, private evidence, duplicate-open prevention |
| GET/PATCH /api/admin/applications/:id | Administrator | Pending-only verification, rejection reason, audit and notification |
| GET/PATCH /api/admin/reports/:id | Administrator | Private inspection/resolution; review visibility/rating update atomically |
| GET/PATCH /api/admin/users/:id | Administrator | Filtered records; protect current/last admin; reversible status with reason |
| GET/PATCH /api/admin/listings/:id | Administrator | Preserve approval and bookings; reversible suspension; audit |

Use a unique cart/local-date reservation index and retry-safe booking/decision requests. Queue notification emails after committed updates, retry failed deliveries independently and never roll back a saved booking because a provider is unavailable. Store uploaded photos outside the database with server-side type/size inspection. Keep secrets server-side.

## Nonfunctional scope

| Requirement | Phase 4 evidence or remaining work |
| --- | --- |
| NF01–NF02 | Local interface and 20-record pages implemented. 100-session/1,000-cart/10,000-booking load and p95 targets are not measured. MongoDB indexing is back-end work. |
| NF03 | Required labels, retained form values and visible feedback implemented. A five-person usability study is not claimed. |
| NF04 | Semantic inputs, labelled errors, native modal focus, keyboard controls, visible focus and reduced-motion support. Core mobile controls designed for 44 px targets. Full screen-reader/WCAG certification is not claimed. |
| NF05–NF07 | Browser auth/role/transition simulations and rule tests. HTTPS cookies, server throttles, production hashing, database transactions and distributed concurrency remain server responsibilities. |
| NF08 | Quota/storage feedback implemented. Daily server backups and restoration targets remain deployment work. |
| NF09 | Responsive Chromium checks completed at five widths. Edge, Firefox and Safari runs are not claimed. |
| NF10 | Maps have local schematic pins/list fallback. Real email queue/failure retry is not implemented. |
| NF11 | UI hides private evidence/contacts appropriately and saves moderation audit. The demo dataset itself remains inspectable client-side. |
| NF12 | React UI is separate from domain and persistence adapters. Express/MongoDB services are specified for the next phase. |
