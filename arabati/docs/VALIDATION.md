# Validation record

Validation date: **14 November 2026**. Tests use fictional demo data. The automated suite fixes its clock to a known Riyadh date; the app examples use relative dates.

## Automated checks

`npm test` passed **32 of 32 tests** with zero failures. The suite exercises independent outcomes rather than merely duplicating component rendering.

Covered cases: Riyadh date boundaries; invalid calendar dates; active/approved visibility; combined search; nonreserving Pending states; registration validation; valid request snapshot/alerts; capacity/budget/duration; customer-only requests; duplicates; blocked/reserved dates; acceptance/competing declines; 20 serialized competing decisions with exactly one winner; unauthorized decisions; reason/owner/time cancellation; reservation release; completion timing/ownership; unique verified review validation; blocks/declines/unblocks; package snapshots; listing values; pending submission visibility; verification checks/rejection reasons; suspension/restoration; admin protection; private report snapshot/duplicates; hidden review rating changes; owner-only notifications; admin read-only status guards; login retry limits; derived registration credentials; expiring single-use resets/session versions; and profile/current-password checks.

The 20-decision test is **serialized state testing**, not a real multi-user database concurrency test. The latter belongs to NF07 back-end validation.

`npm run build` produces the compiled site and one-file preview. Dependencies are pinned and `package-lock.json` is included. The single-file preview embeds the app bundle/styles/assets and uses no runtime module imports. Map tiles are an optional provider request in served mode, not required for the core interface.

## Browser checks completed

| Check | Observed result |
| --- | --- |
| Initial desktop design | Original cart art, brand colours, navigation, search form and results render cleanly |
| Search and empty state | SAR 1 budget returns no carts; clear filters restores results; category updates results |
| Guest protected action | Request booking opens sign-in and retains the target cart/package/date |
| Invalid booking | Duplicate date, absent venue and unchecked notice produce inline errors with entered data retained |
| Valid booking | Sample future event created as ARB-1101, Pending, with confirmation and tracking link |
| Vendor decision | Same ARB-1101 record appears in vendor requests; acceptance updates status and derived counts |
| Event completion | Seeded past accepted ARB-1020 can be completed; Completed count increases |
| Listing editor on phone | Added Cold brew at SAR 20 and saved; menu/package editor remains within viewport |
| Calendar on phone | Actual month grid, state colours and date selection render; blocking a Pending request date updates it and shows confirmation |
| Admin verification | Palm Coffee application approved after all three checklist items; application count and public results update |
| Private report resolution | R-204 hidden/resolved with reason; Open queue empties and public review count/average change |
| Records on phone | Users/search/status/role controls stack cleanly; current administrator’s Suspend action is disabled |
| Provider fallback | List remains usable when map tiles cannot load; schematic pins reference the same carts |

The sample data is restored for the final demo. These checks use fictional data, not a real marketplace.

## Responsive checks

The real app was rendered in a development iframe at each nominal CSS width below. Chromium reserves 15 px for its vertical scrollbar; no content extends beyond the available viewport. Both Discover and cart profile were measured.

| Nominal width | Available document width | Discover scroll width | Profile scroll width | Horizontal overflow |
| ---: | ---: | ---: | ---: | --- |
| 360 | 345 | 345 | 345 | None |
| 390 | 375 | 375 | 375 | None |
| 768 | 753 | 753 | 753 | None |
| 1024 | 1009 | 1009 | 1009 | None |
| 1920 | 1905 | 1905 | 1905 | None |

The 360 px listing editor/calendar/administrator records and 768 px administrator overview were also visually inspected. The calendar uses wider edge-to-edge phone spacing to accommodate usable day targets. `qa/responsive.html` is available only on the dev server, not in the deployed production app.

## Limits of verification

Only the provided Chromium browser was available for UI checks. Other browser engines, a physical touch device, a five-person usability study, a full assistive-technology audit, production load/backup tests, server authorization and real email delivery were not verified. Original Milestone 3 performance and security statements remain targets. OpenStreetMap availability depends on the network/provider; the app does not claim guaranteed tile service.
