# HR page coverage ledger — chat-19

Date: 2026-10-18. Branch: `chatgpt/chat-19-b`.
Inventory authority: `docs/orchestrator/ui-ux/pages-hr.md` (22 /hr routes).
Scope: independently reviewed HR/recruiter page entry points and chat-15/chat-16 contributions. No live browser or PostgreSQL run is claimed by this lane; cloud CI is run and reported by orchestrator.

## Evidence levels
**Source** tests assert declared route permissions, vocabulary, responsive classes, loading/error boundaries, and no insecure page rendering. **Direct** tests invoke an async server page with role/service mocks or invoke a model with hostile inputs. **Integration needed** means source or mocked tests do not establish persistence, network, or actual browser behavior. A source test is never counted as end-to-end verification.

## Per-page ledger

| Route | Source | Source test | Behavioral test beyond source | Evidence / remaining work |
|---|---|---|---|---|
| `/hr/activity` | `src/app/(authenticated)/hr/activity/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-activity-results-pages.test.ts` | Direct server-page boundary plus source checks |
| `/hr/calendar` | `src/app/(authenticated)/hr/calendar/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-calendar-company-pages.test.ts` | Direct session-denial and query/chooser tests |
| `/hr/colleges` | `src/app/(authenticated)/hr/colleges/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` (executed redirect) | Direct redirect/alias entry check |
| `/hr/company` | `src/app/(authenticated)/hr/company/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-calendar-company-pages.test.ts` | Direct session-denial and query/chooser tests |
| `/hr/company/reports` | `src/app/(authenticated)/hr/company/reports/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-scope-pages.test.ts` | Direct server-page boundary plus source checks |
| `/hr/conversations` | `src/app/(authenticated)/hr/conversations/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts` | Direct server-page boundary, stale grant and partial failure tests |
| `/hr/conversations/[threadId]` | `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-conversation-page.test.ts` | Direct server-page boundary plus source checks |
| `/hr/drives` | `src/app/(authenticated)/hr/drives/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-drive-list-page.test.ts` | Direct wrong-tenant, malformed query, no-access and chooser tests |
| `/hr/drives/[jobId]/interview-slots` | `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | Direct server-page validation, role denial and empty state |
| `/hr/drives/[jobId]/messages` | `src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | Direct server-page boundary plus source checks |
| `/hr/drives/[jobId]/rounds/editor` | `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | Direct server-page validation, role denial and empty state |
| `/hr/drives/[jobId]/rounds/editor/remove/[roundId]` | `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | Direct server-page boundary plus source checks |
| `/hr/drives/new` | `src/app/(authenticated)/hr/drives/new/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-request-drive-page-01.test.ts` | Direct server-page boundary plus source checks |
| `/hr/drives/proposals` | `src/app/(authenticated)/hr/drives/proposals/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts` | Direct denial, malformed route, no-access, projection-boundary tests |
| `/hr/drives/recorded-outside` | `src/app/(authenticated)/hr/drives/recorded-outside/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-scope-pages.test.ts` | Direct server-page boundary plus source checks |
| `/hr/home` | `src/app/(authenticated)/hr/home/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts` | Direct denial, malformed route, no-access, projection-boundary tests |
| `/hr/messages` | `src/app/(authenticated)/hr/messages/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` (module alias identity) | Direct redirect/alias entry check |
| `/hr/notifications` | `src/app/(authenticated)/hr/notifications/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-notifications-page.test.ts` | Direct server-page boundary plus source checks |
| `/hr/placements` | `src/app/(authenticated)/hr/placements/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts` | Direct denial, malformed route, no-access, projection-boundary tests |
| `/hr/placements/jobs/[jobId]` | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` (deny and redirect) plus existing applicant policy tests | Direct denied IDOR/expired/legacy redirect, full applicant UI remains integration scope |
| `/hr/profile` | `src/app/(authenticated)/hr/profile/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-profile-page.test.ts` | Direct server-page boundary plus source checks |
| `/hr/round-results` | `src/app/(authenticated)/hr/round-results/page.tsx` | `tests/unit/ux-hr-rollout.test.ts`, `tests/unit/chat19-hr-page-contracts.test.ts` | `tests/unit/HR-BREAK-chat19-activity-results-pages.test.ts` | Direct server-page boundary plus source checks |

## HR and Projects role journey contracts

| ID | Boundary | Test | Outcomes |
|---|---|---|---|
| PROJ-HR-01/02/03/04/05/07/08 | authorized recruiter sees only TPO-shortlisted learner project links under same college and employer, never unsafe URLs | `tests/unit/chat19-projects-recruiter-role-journey.test.ts` | Direct data-projection policy tests + source assertions. PostgreSQL grant revocation during requests outstanding |
| HR-BREAK-DRIVES-01 | `/hr/drives` wrong college, expired role, invalid filters and multi-grant chooser | `tests/unit/HR-BREAK-chat19-drive-list-page.test.ts` | Direct page denial before service calls |
| HR-BREAK-ACTIVITY-01 | activity and round-result route denial, bad filters, stale round and zero-result page | `tests/unit/HR-BREAK-chat19-activity-results-pages.test.ts` | Direct service-mocked page tests; safe college selection and no guessed round |
| HR-BREAK-JOB-01 | deep-linked recruiter job denies expired/wrong employer and validates before messages redirect; retired aliases | `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` | Direct async 404/redirect checks, redirect/alias identity, service-mocked; applicant rendering remains integration scope |
| HR-BREAK-HOME-01 | Today, placement portfolio and proposal-history route permissions, wrong-college and false-success prevention | `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts` | Direct async routes, defensive query validation, no-global fallback |
| HR-BREAK-CALENDAR-01 | calendar day fallback and Company & Team expired session, malformed search, report redirect, zero grants | `tests/unit/HR-BREAK-chat19-calendar-company-pages.test.ts` | Direct account/page tests, mocked recruiter summary |
| HR-BREAK-ROUNDS-02 | editor and interview-slot routes: wrong deep link, 401/403 and no-round/slot states | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | Direct read-boundary tests for both route pages |
| HR-BREAK-ROUNDS-01 | authorized drive conversation and stale round removal actions | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` | Direct role, invalid identifier, noneditable round, hidden optimistic version, empty drive thread |
| HR-BREAK-REPORTS-01 | company reports and historical external drive page | `tests/unit/HR-BREAK-chat19-scope-pages.test.ts` | Direct report filters, expired session, college-selection scope, forged save confirmation |
| HR-BREAK-CONVO-04 | general conversation inbox fails softly if a second grant check or decision notice service fails | `tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts` | Direct async role and partial-failure tests; cached general preview and inline reply suppressed on failed re-read |
| HR-BREAK-CONVO-01/02/03 | recruiter conversation detail page, wrong-role and expired sessions, malformed IDs/pages, revoked thread, contaminated company job row, auxiliary service failure | `tests/unit/HR-BREAK-chat19-conversation-page.test.ts` | Direct async page tests, defense-in-depth company check, safe degraded state |
| HR-BREAK-NOTIFICATIONS-01 | notifications page 401/invalid filters/no grant/multicollege/empty tenant-scope | `tests/unit/HR-BREAK-chat19-notifications-page.test.ts` | Direct async page tests; notification DB reading and CSV download still integration scope |
| HR-BREAK-PROFILE-PAGE-01 | profile page session expiry, removed recruiter, private identity and profile read failure | `tests/unit/HR-BREAK-chat19-profile-page.test.ts` | Direct async page tests, separate profile update service concurrency and CAS tests needed |
| HR-BREAK-profile-01/02 | profile edits and tenant-level visibility | `tests/unit/HR-BREAK-profile-01.test.ts` | Model invalid inputs and copy recovery; DB CAS remains integration scope |
| HR-BREAK-drive-payload-01 | off-campus recruiter external application link policy | `tests/unit/HR-BREAK-drive-payload-01.test.ts` | Reject local address, malformed HTTPS, invalid compensation and round presets |
| HR-BREAK-double-submit-01 | draft request retries | `tests/unit/HR-BREAK-double-submit-01.test.ts` | Model key persistence and source synchronous guard; browser rapid click and DB persistence are not simulated |
| PROJ-BREAK-HR-COLLEGE-01 | College Admin vs recruiter vs Super Admin explicit acting college scope | `tests/unit/PROJ-BREAK-chat19-admin-college-scope.test.ts` | Direct permission-model exercise: selected college only, no grant-as-membership shortcut, denied permission fails closed |
| COL-XA-03/08/09 | college Project listing scope, malformed filters, template outage, mobile tables | `tests/unit/chat19-college-cross-audit.test.ts`, `tests/unit/chat19-college-source-coverage.test.ts` | Source plus real filter-model validation; central `getProjectAdminCollegeId` verified in code |

## Cross-audit boundaries and handoff

- Chat-15 owns HR services, placement job transitions and the full HR ledger. Chat-16 owns messaging, email bridge, notification and inbound-mail services. This ledger does not duplicate ownership or claim their unrun coverage.
- HR-XA-09: `/hr/conversations` Notification inbox formerly linked to its own `/hr/messages` alias. Corrected to actual `/hr/notifications`; direct page regression verifies no self-loop.
- HR-BREAK-JOB-02: a valid URL with an invalid applicant/round/offer/page filter is a recoverable filter error, not a raw exception or hidden loss of recruiter context. Direct page tests verify clear-filters recovery; invalid job IDs still return 404.
- Additional source-level finding HR-BREAK-CONVO-02: a contaminated job service row bearing another employer's companyId must not create a drive link; page now checks companyId alongside jobId/collegeId. Regression direct page test is in the conversation suite.
- Additional source-level finding HR-BREAK-CONVO-03: failure of optional drive change-request retrieval must not lose a legitimate, authorized conversation. This now shows an actionable soft-failure state; test asserts message survives and raw error stays hidden.
- `docs/design-system/audits/UX-ROLLOUT-AUDIT-college-chat-19.md` already records the 85 college page-source survey and follow-up limits. Source-level complete is not a browser accessibility PASS.
- The orchestrator's latest `typecheck-errors-latest.md` lists no chat-19 source failures. The recent `unit-failures-latest.md` named COL-XA-09 and source-coverage-02 and this lane updated their stale assumptions to assert actual current central college scope, without removing their fail-soft/tenant-scope requirements.

## Remaining quality gates

Cloud results from the next merge must confirm new tests. Real route rendering for each page at 320/360/390px, keyboard, screen-reader, modal escape/focus return, service latency and PostgreSQL transactional races remain acceptance gates. All 22 have source contracts; all twenty-two entry routes have directly invoked page or redirect/alias tests in this ledger. No 90%+ branch coverage or exhaustive end-to-end acceptance is claimed.

## Unowned UX spillover — placement/HR reusable report table

| ID | Source | Direct behavioural tests | Cases exercised | Remaining |
|---|---|---|---|---|
| UX-SPILL-HR-01 | `src/components/placements/report-interactive-table-export-model.ts`: `safeReportCsvCell`, `safeReportTsvCell`, `reportTableCsv`, `reportTableTsv`, `safeReportDownloadName` | `tests/unit/chat19-report-table-export-security.test.ts` | Newline/tab formula prefixes, Unicode whitespace / separator bypasses, CRLF, CSV quote/comma escaping, actual negative numeric value vs string, TSV row/column injection, empty/long filename | Browser clipboard/download and Excel/LibreOffice compatibility require integration |
| UX-SPILL-HR-02 | `src/components/placements/report-interactive-table.tsx`: `ReportInteractiveTable` | `tests/unit/chat19-report-interactive-table-render.test.tsx` | Render full row fields on phone through shared DataTable cards, escaped hostile HTML, sorting controls, explicit empty state, 44px touch targets | Browser keyboard/screen-reader and responsive screenshots at 320/360/390px still required |
| UX-SPILL-HR-03 | Same report table | Same SSR test | Mobile filter/columns sheets have bounded viewport and dismiss controls | Interactive focus-return and dismissal tested in browser only |
| UX-SPILL-HR-04 | `src/components/placements/report-interactive-table-download-model.ts`: `trySaveReportCsv` | `tests/unit/chat19-report-download-lifecycle.test.ts` | Successful download; browser Blob denial, click exception, deferred cleanup, timer failure and revocation failures; no raw errors or false-success return | Real browser support and CSP variations |

The previous raw report `<table>` is now rendered via the shared, audited `DataTable`. This component was listed in generated `docs/audit/ux/COVERAGE-MATRIX.md` under raw tables and is not a chat-15/chat-16-owned service; this is an explicit unowned spillover pickup.
| UX-SPILL-COL-FUNNEL-01 | `src/components/placements/college-hiring-funnel.tsx`: `CollegeHiringFunnel` | `tests/unit/chat19-college-hiring-funnel-mobile.test.tsx` | Direct SSR of all nine stages, company/job/total, accessible mobile cards, summary totals, authorized empty state and original CSV link | 320/360/390px actual browsers and backend scoping are release integration gates |

| UX-SPILL-DRIVE-DAY-01 | `src/components/placements/placement-drive-day-overview.tsx`: `PlacementDriveDayOverview` | `tests/unit/chat19-drive-day-candidates-mobile.test.tsx` | Direct SSR of candidate name, employer-visible role/contact, membership, schedule exception, applied outcome and empty rounds; no raw 42rem table | Device/keyboard integration and service-level scoping pending |
| HR-BREAK-NOTIFICATIONS-02 | `src/components/hr/hr-notification-read-button.tsx` / `src/modules/placements/hr-notification-read-feedback-model.ts` / shared `createHrBellMutationGate` | `tests/unit/HR-BREAK-chat19-notification-ack-02.test.tsx` | Same-tick double submits rejected by synchronous gate; terminal successful state; 401/403/404/409/429 safe feedback; active keyboard/44px; POST expectedCreatedAt preserved | DB CAS race/actual browser event integration remains |

## Additional independent messaging cross-audit

| Gap ID | Exported function / boundary | Behavioral test | Cases |
|---|---|---|---|
| HR-BREAK-JOIN-CODE-01 | `src/modules/messaging/public-join-code-delivery.ts`: `deliverPublicRecruiterJoinCode` | `tests/unit/HR-BREAK-chat19-recruiter-join-code-delivery.test.ts` | Invalid OTP and Unicode suffix rejected before network; email recipient runtime policy; empty token; insecure endpoint; missing template; correct POST/recipient/template payload; provider 429 and network rejection fail closed |

This is a second-pair-of-eyes test for the chat-16-owned messaging code and fills the `public-join-code-delivery.ts` unreferenced-file gap in the previously generated WEAK-AREAS snapshot. No source change was necessary based on the boundaries inspected. A real delivery provider and device end-to-end test remain outside mocked unit scope.

## Direct messaging receipt-service and CSV second-pair-of-eyes coverage

| Gap | Export | Direct test and cases | Remaining |
|---|---|---|---|
| HR-BREAK-MESSAGING-HISTORY-01 | `src/modules/messaging/receipt-history-service.ts` → `exportTpoMessagingHistory` | `tests/unit/HR-BREAK-chat19-messaging-receipt-history-service.test.ts`: no membership, wrong role, suspended/disabled actor, persisted grant recheck within transaction, unsafe filter validation before DB, 2001-row export cap, accepted vs delivered distinction | PostgreSQL actual query isolation, transaction snapshots and large-data EXPLAIN |
| HR-BREAK-MESSAGING-HISTORY-01 | same → `listTpoMessagingHistory` | Same direct test: role/tenant checks, page request beyond final page clamps, SQL limit 25 and offset 25, provider acceptance not delivery | Parallel role revocation DB integration |
| HR-BREAK-MESSAGING-CSV-02 | `src/modules/messaging/receipt-history-export-model.ts` → `messagingHistoryCsv` | `tests/unit/HR-BREAK-chat19-messaging-csv-unicode.test.ts`: Unicode format/zero-width/paragraph separators before spreadsheet formulas, CRLF, embedded quoted CSV, aggregate-only privacy, accurate accepted counts | Imported Excel/LibreOffice validation and actual download HTTP headers |

The receipt-history service had no previous direct test reference in the generated weak-areas snapshot. These are independent tests for the chat-16-owned messaging implementation, not a claim that every messaging service has full database coverage.

## Unowned TPO request clipboard evidence

| ID | Public export | Direct test | Cases |
|---|---|---|---|
| UX-SPILL-TPO-CLIP-01 | `requestRowsTsv` in `src/components/placements/tpo-request-page-clipboard.tsx` | `tests/unit/UX-SPILL-chat19-tpo-request-clipboard.test.ts` | Selected visible-column projection, default all-column compatibility, empty selection blocked, Unicode/formula injection, TSV delimiter/row forgery, omitted hidden employer/roll values |

This is an independent TPO/HR workflow review; real clipboard permission denial, selection state changes and mobile browser behavior still need interactive acceptance.

## TPO request mobile component cross-audit

| ID | Component | Direct behavioural evidence | Cases |
|---|---|---|---|

| UX-SPILL-TPO-CLIP-02 | `TpoRequestPageClipboard` component | `tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx` | SSR verifies responsive DataTable cards, request status, employer/name, record selector, empty state and disabled copy; original copy/export model unaffected |

| UX-SPILL-TPO-CLIP-03 | `sortRequestClipboardRows` and `selectedRequestClipboardRows` in request clipboard model | `tests/unit/UX-SPILL-chat19-tpo-request-clipboard.test.ts` | Immutable newest/oldest sorting, decided-null ordering, exact visible-page subset, no stale prior-page selection leakage |

## HR notification stale-tab boundary

| ID | Export and route | Behavioral evidence | Remaining |
|---|---|---|---|
| HR-BREAK-NOTIFICATIONS-02 | `clampHrInboxPage` in `hr-notifications-model.ts` and `listHrNotifications` | Direct boundary tests: empty inbox, stale page 9999, multi-page 26/51 records, malformed/overflow numeric page, strict query schema and unchanged raw bounds helper. Database-backed `tests/integration/hr-notifications.test.ts` checks a real stale page URL returns the authorized record rather than a false empty state. | Cloud CI/database gate verifies run; no browser keyboard claim |

## Further HR company reports page/stale-filter cross-audit

| ID | Export and source | Behavioral test | Coverage boundary |
|---|---|---|---|
| HR-BREAK-REPORTS-02 | `clampRecruiterCompanyReportPage` in `recruiter-company-reports-model.ts`; `getRecruiterCompanyReports` | `tests/unit/HR-BREAK-chat19-company-report-stale-page.test.ts` | 0/1/26/51/501 authorized drives, custom page sizes, impossible/expired page numbers, strict tenant/schema checks, SQL offset based on authorized count, UI metadata synchronized; database race testing remains cloud CI responsibility |

## Further cross-module break-it evidence: spreadsheet marks and touch targets

| ID | Sources | Direct test | Behavior verified |
|---|---|---|---|
| HR/PROJ-CSV-UNICODE-03 | All five spreadsheet/TSV serializers for HR reports, team exports, Projects workspace exports, TPO request clipboard and message receipt history | `tests/unit/chat19-invisible-mark-export-matrix.test.ts` | Combining-mark prefixes U+034F, U+0301 and U+20DD cannot bypass quoted formulas; U+0085 and vertical tabs do not forge report rows |
| UX-SPILL-TPO-CLIP-05 | `src/components/placements/tpo-request-page-clipboard.tsx` | `tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx` | Sort select, disclosure summary and column reset have minimum 44px targets and a visible keyboard focus ring |

## HR duplicate-parameter adversarial page entries

| ID | Page | Direct behavioral evidence | Expected security invariant |
|---|---|---|---|
| HR-BREAK-QUERY-05 | Notifications, conversations and activity | `tests/unit/HR-BREAK-chat19-notifications-page.test.ts`, `tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts`, `tests/unit/HR-BREAK-chat19-activity-results-pages.test.ts` | Duplicate college, page, or search keys are invalid input, not a first-value fallback. Every one is rejected before tenant-aware query/service invocation; legacy invalid-filter recovery copy stays exact. |

## Post-merge service authorization and high-cardinality search tests

| Gap | Export and service | Direct tests | Cases and integration limits |
|---|---|---|---|
| HR-BREAK-NOTIFICATION-OWNER-06 | `ownsHrNotificationActor` and `markHrNotificationRead` | `tests/unit/HR-BREAK-chat19-notification-ownership.test.ts` | Exact recruiter identity, disabled principal, absent recruiter, mismatched principal, early denial before DB/own-job lookup |
| HR-BREAK-INBOX-SEARCH-07 | `recruiterMessageSearchLimit`, `filterRecruiterConversations`, `listHrConversations` | `tests/unit/HR-BREAK-chat19-inbox-search-boundary.test.ts` | Distinct 1205 scoped matching threads and last-page 1201–1205, foreign thread excluded, dynamic SQL bound to authorized accessible IDs. Real PostgreSQL large-fanout plan and load tests not run |

## HR Today notifications vs Messages acceptance

| Gap | Route and source | Direct regression | Navigation contract |
|---|---|---|---|
| HR-BREAK-TODAY-UNREAD-08 | `hrTodayUnreadAction` from `hr-today-unread-model.ts` | `tests/unit/hr-today-unread-model.test.ts` | The unread system-notification card opens `/hr/notifications` scoped to the selected college and unread-only view; it never opens `/hr/messages` (the conversation alias). Existing no-access exclusion retained. |

## CI 834983cc and HR drive thread composition follow-up

| Gap | Source / direct test | Verified contract at test-authoring level | Pending |
|---|---|---|---|
| PROJ-BREAK-EXPORT-02 | `tests/unit/PROJ-BREAK-chat19-project-workspace-export-ui.test.tsx` | Real SSR button disabled **attribute** represents action availability, ignoring Tailwind disabled CSS classes | Cloud CI, actual download |
| COL-XA-14 | `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`, `tests/unit/chat19-college-cross-audit.test.ts` | Faculty history shared `DataTable` retains accessible `Persisted teaching assignments` caption with no raw wide table | Cloud CI, screen reader |
| HR-BREAK-DRIVE-THREAD-09 | `getRecruiterDriveConversations`, `tests/unit/HR-BREAK-chat19-drive-conversation-service.test.ts` | Invalid UUID rejected before services, workspace authorization precedes thread reads, independent same-college/same-recruiter/same-job filter; raw foreign threads excluded | PostgreSQL role-revocation and browser navigation integration |

## Further HR profile independent model coverage

| ID | Export | Behavioral tests | Scope |
|---|---|---|---|
| HR-BREAK-PROFILE-IDENTITY-10 | `ownRecruiterGrant`, `getRecruiterSelfProfile`, `leaveOwnRecruiterCollegeAccess` | `tests/unit/HR-BREAK-chat19-recruiter-profile-service-identity.test.ts`; `tests/unit/HR-BREAK-chat19-profile-page.test.ts` | Context recruiter must belong to the exact signed-in user; reject before any employer/grant read or write when IDs differ |
| HR-BREAK-PROFILE-NAME-11 | `hrRecruiterNameFieldsSchema`, `splitHrRecruiterName`, `joinHrRecruiterName`, `sameHrNameVersion` | `tests/unit/HR-BREAK-chat19-profile-name-model.test.ts` | Multi-token name, Unicode whitespace, strict field validation and length caps, forbidden role/company input, millisecond CAS with IST/UTC equivalence |

## HR Today scheduled interview slot limit and race cross-audit

| ID | Entry / services | Direct behavioural test | Coverage and remaining gate |
|---|---|---|---|
| HR-BREAK-TODAY-SLOTS-12 | `listRecruiterTodayRoundsNeedingSlots` and `recruiterTodayRoundsNeedingSlots` | `tests/unit/HR-BREAK-chat19-today-slots-query-limit.test.ts` | 110 scheduled rounds with 100 earlier covered interviews still produce next eight actionable slots; offered/BOOKED excluded; PROPOSED retains needs-offer state; post-query race exclusion; SQL `NOT EXISTS` precedes `LIMIT 100`, scoped to authorized job IDs and college. PostgreSQL runtime/EXPLAIN and multi-tenant browser checks still needed. |

## HR message-delivery and company-team second-pair-of-eyes coverage

| ID | Boundary | New direct evidence | Remaining |
|---|---|---|---|
| HR-BREAK-MAIL-REDIRECT-13 | Public recruiter join-code and recruiter message digest provider POST | `tests/unit/HR-BREAK-chat19-recruiter-join-code-delivery.test.ts`, `tests/unit/HR-BREAK-chat19-mail-redirect-boundary.test.ts`: never follow redirects; no retries of non-idempotent content; sanitization, allowlist/provider failure and correct Reply-To | Live SMTP/provider config and host allowlist review |
| HR-BREAK-TEAM-GRANT-14 | `getRecruiterCompanyTeam` persisted selected grant ID | `tests/unit/HR-BREAK-chat19-company-team-grant-id.test.ts`: exact grant ID, user and relationship binding, ACTIVE conditions, same-college selector and borrowed recruiter exclusion | SQL integration test with two same-relationship grants and first revoked |

## HR Today withdrawn applicant privacy

| ID | Boundary | Direct behavioral test | Remaining |
|---|---|---|---|
| HR-BREAK-OFFER-FOLLOWUP-15 | `listRecruiterTodayOfferActions`, shared `isRecruiterSharedCandidateAllowed` | `tests/unit/HR-BREAK-chat19-today-offer-withdrawn.test.ts`: withdrawn/rejected/suspended/foreign candidates not shared; SQL offer aggregate requires SUBMITTED application and same college, active person, shortlist, published/unarchived job. | Persisted withdrawal/offer race and staged PostgreSQL tests remain cloud integration gates. |

## HR Today slot proposals with populated portfolios

| ID | Export and source | Behavioral test | Verified boundary, remaining integration |
|---|---|---|---|
| HR-BREAK-TODAY-SLOTS-12 | `listRecruiterTodayRoundsNeedingSlots` with `NOT EXISTS` filtering; `recruiterTodayRoundsNeedingSlots` pure model | `tests/unit/HR-BREAK-chat19-today-slots-query-limit.test.ts` | Pre-limit SQL excludes already booked/offered rounds, per-tenant employer jobs/college remain scoped, 110-round action opportunity retained, proposed vs cancelled distinction, race-time recheck. PostgreSQL planner and concurrent writes require CI/integration verification. |
