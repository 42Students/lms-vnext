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
