# Arabati Phase 4 Front End

**SWE 363-01 · Term 261 · Team 20**

Arabati helps people find verified coffee, food and dessert carts for events in Saudi Arabia’s Eastern Province. This React front end implements the customer, vendor and administrator workflows from the supplied Milestone 3 mobile prototype, with layouts for phones, tablets and desktops.

## Start here

Install Node.js 22.12 or newer, open a terminal in the project folder and run:

```sh
npm ci
npm run dev
```

Open the URL printed in the terminal, normally `http://localhost:5173`. On Windows PowerShell, `npm.cmd ci` and `npm.cmd run dev` also work if the shell blocks `npm.ps1`.

```sh
npm test          # 32 deterministic domain and repository tests
npm run build     # Production build in dist/ plus a one-file preview in preview/Arabati_Preview.html
npm run preview   # Serve the production build
```

No database, API key, environment file, external font or image download is required to run the core demo. Map tiles are optional; schematic pins and the cart list remain usable when the provider is unavailable.

## Demo accounts

Choose a role on the sign-in page, or enter the following public demo credentials. All three share **ArabatiDemo12!** as the initial password.

| Role | Email | Starting view |
| --- | --- | --- |
| Customer | customer@arabati.demo | My bookings |
| Vendor | vendor@arabati.demo | Roast & Gather dashboard |
| Administrator | admin@arabati.demo | Admin overview |

All data and contact numbers are fictional. Changes persist on this browser and origin. Use **Explore the demo → Reset demo data → Restore demo** in the footer to restore the examples. A reset removes changes, signs out and restores the original accounts. A separate browser or origin has separate data.

## What works

- Guest event search by city, future date, category and maximum package price; category tabs, sorting, list/map views, working cart pins and empty states.
- Cart packages, menu, verified reviews, availability and sign-in redirects for protected actions.
- Registration, sign-in, generic login errors, a local five-failure retry limit, simulated single-use password reset, account edits, password change and logout.
- Customer request form, inline validation, preserved inputs on error, confirmation reference, status/history tracking, cancellation, manual WhatsApp draft preview and one review per completed event.
- Vendor request decisions, full-date reservations, competing request handling, completion after scheduled end, month calendar, blocks, listing/photo/menu/package editing and verification submission.
- Administrator verification, private reports, hide/dismiss/suspend resolutions, account/listing suspension and restoration, filters, 20-record pagination and read-only booking oversight.
- Shared alerts, read/unread actions, derived dashboard counts, public rating recalculation and saved booking package snapshots.

## A five-minute demonstration

1. Browse Discover as a guest. Try a SAR 1 budget to see the empty state, clear filters, then open Roast & Gather. Change packages and inspect Menu and Reviews.
2. Choose **Request booking** and sign in using the Customer demo button. Select a free future date different from your existing pending/accepted events. Enter a venue, keep guests and duration within the package limits, confirm the notice and send. Keep the generated ARB reference.
3. Sign out through Account. Sign in as Vendor, open that reference and accept it. The date is reserved, the request history changes and alerts are created. The customer’s Bookings view shows the same Accepted record after switching back.
4. In the vendor’s Accepted events, open **ARB-1020**, an event seeded for yesterday, and mark it completed. A customer review is now available. **ARB-0931** is also seeded as Completed and initially unreviewed.
5. In Calendar, block a future date with a Pending request. Confirm the warning; the request becomes Declined. Accepted dates cannot be blocked. Removing a block does not reopen declined requests.
6. Sign in as Administrator. Review **Palm Coffee**, complete all three checks and approve it. It becomes public if its account/listing are active. Resolve **R-204** by hiding its review with a reason; Roast & Gather’s public average/count recalculates.
7. Inspect Records → Bookings. Open history and confirm that administrators have no accept, cancel or complete controls. In Records → Users, the current administrator cannot be suspended.

The initial dates are relative to the day the example data is created, using Asia/Riyadh. Referenced IDs are stable after a reset.

## Project structure

| Path | Purpose |
| --- | --- |
| src/pages/ | Discover, authentication, booking, vendor, admin and account screens |
| src/components/ | Accessible form controls, dialogs, tabs, icons, SVG cart art and map |
| src/layouts/Shell.jsx | Header, footer, mobile navigation and global dialogs |
| src/context/AppContext.jsx | Shared state, session, notifications and actions |
| src/domain/rules.js | Validation, availability, formatting and public selectors |
| src/services/repository.js | Browser persistence and guarded state transitions |
| src/data/seed.js | Fictional examples with relative event dates |
| tests/business-rules.test.js | Meaningful rule, ownership and transition tests |
| qa/responsive.html | Development-only iframe viewport tool |
| scripts/build-preview.mjs | Builds the portable one-file preview |
| docs/ | Traceability, validation, architecture, contribution record and declarations |
| dist/ | Compiled production site included in the submission ZIP |
| preview/ | Generated preview, not tracked as source |

Hash-based routes allow the production build to work on a static host without rewrite rules. React escapes entered text; Leaflet tooltips use text nodes. No private production secret is embedded.

## Scope of this phase

This is an interactive **front-end prototype**. Browser data simulates the future Express/MongoDB service and is accessible to someone inspecting the client. Role/ownership guards are demo behavior, not a security boundary. Password derivation, reset tokens, login throttling and session versions are local simulations. No real email, secure HTTP session, payment or automatically sent WhatsApp message exists.

Browser transactions use the Web Locks API when supported, otherwise a single-context fallback. The tests demonstrate state rules and serialized decisions; they do **not** establish distributed concurrency, server authorization, the production performance targets or database durability. The back-end contract and remaining integration work are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Team members and roles

| Member | KFUPM ID | Role | Files owned |
| --- | --- | --- | --- |
| Member 1: Mhammed Basel Aboalsaud | 202254380 | Customer | `src/pages/Discover.jsx`, `src/pages/Bookings.jsx`, `src/components/CartMap.jsx`, `src/components/CartArt.jsx`, `src/data/seed.js`, `src/domain/rules.js`, `tests/` |
| Member 2: Ali Jihad Alshelaty | 202155070 | Vendor | `src/pages/Vendor.jsx`, `src/pages/Account.jsx`, `src/layouts/Shell.jsx`, `src/components/UI.jsx`, `src/components/Icons.jsx`, `src/services/repository.js` |
| Member 3: Rayan Yasir Albakistani | 202168230 | Admin & Authentication, repository owner | `src/pages/Admin.jsx`, `src/pages/Auth.jsx`, `src/App.jsx`, `src/context/AppContext.jsx`, project setup, README, `AI_USAGE.md` |

Each member commits their own files from their own GitHub account on a feature branch, which is merged into `main` through a pull request.

## Documentation

- [docs/SCREEN_COVERAGE.md](docs/SCREEN_COVERAGE.md): every M01–M20 screen and S01–S04 sheet mapped to the implementation.
- [docs/RUBRIC.md](docs/RUBRIC.md): evidence for all six rubric categories.
- [docs/VALIDATION.md](docs/VALIDATION.md): automated and browser checks, including limitations.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure and the back-end contract for Phase 5.
- [docs/INDIVIDUAL_CONTRIBUTIONS.md](docs/INDIVIDUAL_CONTRIBUTIONS.md): member contributions.
- [AI_USAGE.md](AI_USAGE.md): AI tools used and the files affected.

## References and assets

Design source: supplied **Arabati_Milestone_3+(3).pdf**, particularly pages 6–8 and wireframes on pages 9–20. All cart illustrations, icons and fallback map drawings are original SVG/code in this project. Demo reviews and records are fictional, not collected customer feedback.

Technical references: [React](https://react.dev/learn), [Vite](https://vite.dev/guide/), [Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html), [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/). Third-party package licenses are included in `docs/THIRD_PARTY_NOTICES.md`.
