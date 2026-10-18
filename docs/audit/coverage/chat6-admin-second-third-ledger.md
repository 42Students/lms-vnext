# Chat-6 Super Admin audit — second third (positions 38–74)

**Reference:** `docs/orchestrator/ui-ux/pages-admin.md`; this is the exact 37-route middle segment. All 37 route source files were fetched on `chatgpt/chat-6-b` on 2026-10-19, and their security entry points and user action affordances inspected. **Source review is not functional acceptance.** The DESIGN DIRECTIVE is on hold; no page-surfaces redesign was performed.

## Page-by-page source audit

| # | Route beneath `/admin/` | Source security boundary reviewed | Page/actions reviewed | New behavioral model check |
|---|---|---|---|---|
| 38 | `inbound-mail` | Super Admin role; inbound read service | tabs, q/recipient, paging, status workflow | `CHAT6-ADMIN-INBOUND-01/02` |
| 39 | `lecture-halls` | selected college + academics.manage | create/edit, department/room, CSV, paging | `CHAT6-ADMIN-LECTURES-01/04` |
| 40 | `lecture-halls/[hallId]` | selected college + academics.manage; hall ownership | IST schedule, conflicts, date range and read-only scope | `CHAT6-ADMIN-LECTURES-02/03` |
| 41 | `lessons` | selected college + courses.manage | course/lesson filters, bulk visibility, reorder, export | source review; route/browser verification pending |
| 42 | `live-classes` | delegates guarded ContentDirectoryPage | live-class search, content controls | source review; route/browser verification pending |
| 43 | `module-access` | Super Admin admin-scope.select | rules, hierarchy, filtered colleges | source review; route/browser verification pending |
| 44 | `organizations` | Super Admin admin-scope.select; explicit manage guard | create, archive/restore, search, pagination | source review; route/browser verification pending |
| 45 | `people` | Super Admin; role + membership service | new membership, update, CSV, suspend, filter | `CHAT6-ADMIN-PEOPLE-01/03` |
| 46 | `people/directory` | Super Admin role; masked profile service | role/status tabs, profile, CSV, search, paging | `CHAT6-ADMIN-PEOPLE-01/03` |
| 47 | `people/directory/[membershipId]` | Super Admin guarded membership detail | role, status, contact masking, audit navigation | source review; route/browser verification pending |
| 48 | `people/directory/[membershipId]/audit` | scoped persisted actor and membership audit | audit event list, tenant membership link | source review; route/browser verification pending |
| 49 | `people/unassigned` | Super Admin + no selected college/org | unassigned user status/role/search, paging | `CHAT6-ADMIN-UNASSIGNED-01/02` |
| 50 | `placements` | selected college to manage operations | policy, drive workspace, student lookup | `CHAT6-ADMIN-SCOPED-01/02` |
| 51 | `placements/analytics` | selected college + placements.read | job/cohort/company filter, date range, report/CSV | `CHAT6-ADMIN-PLACEMENTS-01/02` |
| 52 | `placements/applications` | shared AdminScopedReadPage + selected college service | application filter, stage, bulk/export | `CHAT6-ADMIN-APPLICATIONS-01/02` |
| 53 | `placements/applications/[applicationId]` | selected college and joined applicant+job ownership | stage history, schedule and job link | source review; route/browser verification pending |
| 54 | `placements/calendar` | selected college + placements.read | calendar dates/slots and schedule | source review; route/browser verification pending |
| 55 | `placements/drives` | selected college + placements.manage | status, company search, paging, bulk | `CHAT6-ADMIN-DRIVES-01/02` |
| 56 | `placements/hiring` | shared guarded scoped read directory | job status/search/paging | `CHAT6-ADMIN-SCOPED-01/02` |
| 57 | `placements/interviews` | shared guarded scoped read directory | round status/search/paging | `CHAT6-ADMIN-SCOPED-01/02` |
| 58 | `placements/interviews/[roundId]` | service-scoped round details | not-found and related drive | source review; route/browser verification pending |
| 59 | `placements/job-settings` | shared guarded scoped read directory | draft/publication/status filters | `CHAT6-ADMIN-SCOPED-01/02` |
| 60 | `placements/job-settings/[jobId]` | service-scoped job settings detail | not-found and scope | source review; route/browser verification pending |
| 61 | `placements/jobs/[jobId]` | selected college + placements.manage | drive tabs/pipeline and related actions | source review; route/browser verification pending |
| 62 | `placements/jobs/[jobId]/applications` | selected college + placements.manage | application filters, stage controls and export | `CHAT6-ADMIN-APPLICATIONS-01/02` |
| 63 | `placements/jobs/[jobId]/schedule` | selected college + placements.manage | slots, assigned round time, pagination | source review; route/browser verification pending |
| 64 | `placements/jobs/[jobId]/settings` | selected college + placements.manage | deadline, duplicate, archive, publish/edit | source review; route/browser verification pending |
| 65 | `placements/joining` | shared guarded scoped read directory | offer joining status and counts | `CHAT6-ADMIN-SCOPED-01/02` |
| 66 | `placements/joining/[offerId]` | service-scoped offer join detail | not-found/backlink | source review; route/browser verification pending |
| 67 | `placements/new` | selected college + placements.manage before options | drive create + company picker | source review; route/browser verification pending |
| 68 | `placements/offers` | shared guarded scoped read directory | offer status and paging | `CHAT6-ADMIN-SCOPED-01/02` |
| 69 | `placements/offers/[offerId]` | service-scoped offer detail | not-found/backlink | source review; route/browser verification pending |
| 70 | `placements/retention` | selected college + placements.read | retention metrics, applicant link | source review; route/browser verification pending |
| 71 | `placements/screenings` | shared guarded scoped read directory | screening status, paging | `CHAT6-ADMIN-SCOPED-01/02` |
| 72 | `placements/screenings/[applicationId]` | service-scoped screening detail | not-found/backlink | source review; route/browser verification pending |
| 73 | `placements/seasons` | shared guarded scoped read directory | placement season status, paging | `CHAT6-ADMIN-SCOPED-01/02` |
| 74 | `placements/seasons/[seasonId]` | service-scoped season detail | not-found/backlink | source review; route/browser verification pending |

Source entrypoints exist at `src/app/(authenticated)/admin/<route>/page.tsx`, except that the `live-classes` page delegates the secured content-directory implementation. Dynamic routes validate IDs in their service/loader and present not-found for absent resources; page-level guard alone is **never** treated as a database-owned tenant predicate. AdminScopedReadPage is a shared renderer, not a substitute for the selected-college check inside every loader.

## New source-based and executable-unit regressions (authored; not run)

- `tests/unit/chat6-admin-second-third-people-inbound.test.ts`: inbox filters/previews, membership role-tab precedence, private search, unassigned identities global-only, query encoding and pagination.
- `tests/unit/chat6-admin-second-third-placements.test.ts`: 5,000-drive export cap, date range, company rollups, drive state labels, paginated status filters, application query allowlist, stage/source export links, shared admin directory injection and escape rules.
- `tests/unit/chat6-admin-second-third-academic-scopes.test.ts`: classroom capacity/date conflicts, strict lecture-hall query, IST inclusive calendar date window, Super Admin selected-college role and cross-organization permission matrix.
- `tests/unit/chat6-admin-second-third-page-contracts.test.ts`: every one of the 37 listed route files retains its security or delegate boundary; shared scoped-list authorization, recovery and service-owned application/job/college predicates. This is a **source contract**, not a rendered route/browser pass.
- For each source-only page in the table, full page-action and data-mutation acceptance is still outstanding. Existing lane suites cover many routes, but this ledger does not infer test PASS from filenames. No browser, phone, keyboard or real PostgreSQL replay was performed.

## Hardening concerns and next gates

1. Every interactive edit, archive, suspend, publish and bulk action needs same-origin validation and a **persisted** actor + target-tenant check in the same write transaction. Verify alongside chat-3/chat-13 owners; read permission alone is insufficient.
2. CSV export must use precisely the same validated filters, role scope and ownership joins as the visible page; spreadsheet formula defenses and row caps require executed exports.
3. The selected-college header can change between requests; cross-college bookmarked detail IDs must fail closed, including URLs for jobs, offers, applications, sessions and hall schedules.
4. Keyboard focus/escape, mobile 320–390 px rendering, long text, loading, partial backend outage, 404 and permission-loss journeys are **not validated** by source fetches or Vitest source assertions.
5. Nothing in this document claims all 37 routes are proven defect-free; a complete user-journey pass requires the application, database and browser.

**Mode:** branch `chatgpt/chat-6-b` only, `[chat-6]` commit prefix, no CI gating and no executed code.

## Added rendered-page coverage — 2026-10-19

- `tests/unit/chat6-admin-second-third-lecture-hall-pages.test.ts`: actual async list/detail page calls rendered to static HTML. Covers selected-college gate, wrong role, malformed selectors, scoped pagination, 320px-safe classes, invalid IST window and booked-room overcapacity/overlap messages.
- `tests/unit/chat6-admin-second-third-drives-page.test.ts`: actual drive page async render; denies absent/foreign admin roles, malformed decimal selectors, renders selected-college results and mobile structure; failure maps to safe retry or denied state.
- `tests/unit/chat6-admin-second-third-unassigned-page.test.ts`: actual unassigned global identity page async render; redirects wrong roles, denies tenant-scoped user enumeration, rejects forged params, renders empty and populated PII-safe rows, recovers after outage and permission loss.

These SSR tests provide **page-specific behavior** beyond the 37-route source-guard preservation contract, but are still not executed and do not replace browser accessibility, real PostgreSQL or mobile captures.
