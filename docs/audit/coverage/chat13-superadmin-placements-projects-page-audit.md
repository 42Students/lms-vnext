# chat-13 independent Super Admin Placements + Projects page audit

**Date / branch:** 2026-10-18 IST, `chatgpt/chat-13-b`. **Scope:** all 48 current `page.tsx` routes beneath `/admin/placements` (28) and `/admin/projects` (20), including direct root pages. **Method:** fetched and inspected all 48 route sources, then traced seven dynamic/delegated entrypoints into their server components, project access service, and selected-college placement read services. This is **source-level coverage**, not runtime browser, PostgreSQL or production signoff.

## Route-level findings

| Group | Count | Review | Scope / recovery |
| --- | ---: | --- | --- |
| Placement root, analytics, applications, calendar, drives, hiring, interviews, job settings | 11 | Parsed server entrypoint, permission/delegated read, scoped IDs, responsive route templates and no native destructive confirm | Scoped-guarded direct or `AdminScopedReadPage` / `SuperAdminPlacementDetailView`; `getSuperAdminApplicationDetail` checks application job, role option and membership college |
| Placement job workspace, joining, new drive, offers, retention, screenings, seasons, shortlisted, student lookup | 17 | Same source review including selected-tenant job scopes, authenticated context and route-specific drilldown | Scoped read services and `getPlacementJob`; routes retain selected-college empty states where appropriate |
| Projects root, workspace, at-risk, audit, readiness, reassign, submissions | 9 | Direct component/service and safe redirect/delegation; checked action affordance and server access | `AdminProjectSectionPage` and `ProjectWorkspaceReadiness` call `requireProjectManageAccess`; model `getProjectAdminCollegeId` tested with dual-role and disabled actors |
| Templates, template detail/versions/colleges/tasks/resources/sprints, new workspace | 11 | Delegated `SuperAdminTemplateSubviewPage`, exact ID validation, global edit gating and detail roles | Template read service and role-gated editors; unsupported IDs recover via not-found |
| **Total** | **48** | **28 placement + 20 project pages** | **Source-audited, not device-verified** |

No audited route source uses raw `<table>`, `window.confirm()`, `target="_blank"`, or `JSON.stringify(error)`. These predicates do **not** establish accessibility for delegated child widgets. Some routes intentionally omit `getCurrentRequestContext` directly because the server component handles it; the redirect-only route also resolves to a scope-checking section page.

## High-risk adversarial regressions

- `PROJ-BREAK-SA-09`: **S1 fixed** — escaped newline in `admin-submission-review-model.ts` made archived/locked guard part of a `//` comment. Verified corrected source, authored 144-state transition matrix (4 project states × 6 delivery states × 2 lock states × 3 actions).
- `PROJ-BREAK-SA-17`: **S2 fixed** — runtime unrecognized delivery action accidentally resolved as a reviewable action; explicit three-action whitelist now rejects malformed operation codes, with executable negative cases.
- `PROJ-BREAK-SA-10..13`: forged/oversized URL filters, restore CAS, wrong project/submission pairing, audit and archive impact safety.
- `PROJ-BREAK-SA-14`: executable request-context matrix: active SA scoped to A, dual-role SA with membership B, revoked/disabled SA, membership-only B college admin, non-admin learner. B cannot be read via selected A on valid permission requests.
- `PROJ-BREAK-SA-15`: test discovers **all 48 page sources** from filesystem, verifies every direct page uses current request context or an explicit server-authenticated delegate; disallows native confirmation/raw unresponsive table/untrusted new tabs/raw error JSON.
- `PROJ-BREAK-SA-16`: persists scoped project ownership before dynamic route rendering, including template ID parse.
- `SA-PLACEMENT-POLICY-01..04`: transaction-persisted active global SA, serialization of global min/max settings, finite input bounds, and corrected operation when a Super Admin has selected a college.
- `SA-PLACEMENT-POLICY-05`: **S1 fixed** — global placement policy modifications now emit a high-importance audit event inside their write transaction with previous/next value and version; absent-key reset emits no event. Database rollback/audit-read integration remains open.
- `SA-PLACEMENT-POLICY-06`: **S1 fixed** — independently discovered second editor of global interview duration keys in Tenant Settings; both transaction paths now use the same advisory lock and per-key and cross-key constraints. A multi-session PostgreSQL race across the two screens is still mandatory.
- `SA-BOOKED-INTERVIEWS-01/02`: strict calendar-day parsing, scoped booking/round/application/company relationships, 2000-row cap. No live DB fixture was run.

**Test files:** `tests/unit/PROJ-BREAK-SA-security-and-resilience.test.ts` (existing 01–08), `tests/unit/PROJ-BREAK-SA-state-matrix-and-queries.test.ts` (09–13), `tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts` (14–16), `tests/unit/chat13-platform-placement-policy-adversarial.test.ts`, and `tests/unit/chat13-super-admin-booked-interviews-window.test.ts`.

## Continued Projects hardening — 18 October

- `PROJ-BREAK-SA-23/24`: the malformed workspace brief parser now returns independently allocated arrays/fields, closing same-process data contamination between college A and B if a caller mutates fallback state. Runtime Zod validation and mutation regression added.
- `PROJ-BREAK-SA-25`: preserved existing `search`/`q` legacy naming, but explicitly rejects contradictory simultaneous aliases; no breaking rename.
- The CI `ff6819dd` report still lists `SA-PLACEMENT-POLICY-03` and `UX-cross-tpo-second-C13-026-22`. On the current branch the *production* policy parser refines against field-specific limits (commit `9bf3a6c6`), while TPO Reports loading uses exact `Loading TPO reports` wording (`61ade3fd`). Their current source/test contracts agree, but neither is certified green until a newer CI run.

- `PROJ-BREAK-SA-26`: normalized a second Project admin search path: snapshot, risk queue, and submissions all use the same literal-ILIKE helper used by the unsubmitted directory, with a three-function regression contract. Database-side query plan tests remain open.

- `PROJ-BREAK-SA-27..29`: activity log duplicate filters, malformed date/cursor pairs, and contradictory legacy `action/status/eventType` aliases now fail closed while preserving legacy alias names and recoverable invalid-filter copy. Pure behavioral tests authored; database-backed event-filter integrity pending.

## Not cleared for IIT Dharwad release

1. Two-session PostgreSQL adversarial harness: race archived project vs delivery-lock review, accepted offer vs drive archive, policy min/max concurrent writes, rechecked membership changes during action and cross-tenant joined data.
2. End-to-end SA authenticated browser with expired-session, forged search ID, double-submit, stale tab, permission revocation, 320/360/390px scroll/keyboard/loader/recovery and actual rendered child widgets.
3. Full current CI proof: TypeScript, Vitest, ESLint, Playwright, snapshots, migrations, audit events and notification delivery must be executed on a complete checkout. **These suites were authored but not executed in this connector-only run.**

The earlier `docs/audit/coverage/admin-first-chat13.md` already inventories the first **37 of 111** main `/admin` routes. The earlier `docs/design-system/audits/UX-ROLLOUT-AUDIT-tpo-second-chat-13.md` already records a complete **42/42 source review** of TPO route order 43–84 with 27 findings/fixes; this page audit does not change those counts. Neither prior pass is a substitute for browser-based acceptance.


- `PROJ-BREAK-SA-30/31`: fixed Projects admin mentor display/ID projection joins that previously trusted project membership IDs without a same-college, ACTIVE membership constraint; three scoped paths across snapshots, risk queue and submitted-work pages (`6cc66f6d`). Regression `chat13-project-admin-member-tenant-isolation.test.ts` was authored but not run. Pending A/B PostgreSQL validation and active-then-suspended stale-session test.
- `SA-BOOKED-INTERVIEWS-03`: filtered department labels in booked-interview admin projection by the selected college; previously an enrollment referring to a foreign-college program could expose its department label. `chat13-super-admin-booked-interviews-window.test.ts` includes the join contract; database joins not executed.


- `SA-BOOKED-INTERVIEWS-04`: registered BOOKED slots whose application belongs to another job/college now fail an INNER JOIN rather than appearing with missing candidate data. A/B disposable PostgreSQL witness authored and added to harness script; runner evidence pending.
- `SA-PLACEMENT-POLICY-08`: corrupt persisted global policy overrides no longer silently affect displayed limits or duration counterpart comparisons. Bounded canonical numeric parser and adversarial test authored; runner evidence pending.


- `SA-DRIVE-ARCHIVE-NOTIFY-05`: archive notification recipients now require the selected college's persisted membership, rather than any application membership. Source regression added; no external delivery executed.
- `SA-HIRING-REPORT-SCOPE-03`, `SA-PIPELINE-TENANT-02`: Super Admin hiring and funnel counts now exclude forged foreign-college applicant memberships before counting; SQL A/B fixture added alongside source and pure model assertions. Tests not run.


- `SA-SCOPED-CSV-CAP-05`: scoped CSV endpoint now forces 25-row fetches regardless of a manually supplied pageSize. This closes first-250 under-fetch and 1,000-row over-fetch. Mocked service export test written; no browser/CI run.
- `SA-APPLICATIONS-ACADEMIC-05`: Super Admin application directory academic facets now require current ACTIVE enrollment with a consistent cohort/program. New source test and expanded all-page read-service matrix authored; no PostgreSQL execution.
- `SA-ADMIN-LEDGER-01`: 39 dedicated placement admin, Super Admin, report, and platform-policy modules dynamically inventoried; 13 `src/modules/admin-ui` Placements read and CSV services are recorded in the central coverage ledger. Existing route audits cover 37 first-third /admin pages and 48 Placements/Projects pages. None of these inventory counts substitutes for an executed accessibility or tenancy role-journey check.


## IIT Dharwad Projects breaker follow-up — PROJ-BREAK-SA-33..36

| Case | Source and observable behavior | Evidence |
|---|---|---|
| PROJ-BREAK-SA-33 | Super Admin snapshots/at-risk paging rejects coerced hex, exponent, blanks, bad filters and extra keys before any project DB or scope read | `src/modules/projects/admin-insights-service.ts` (newer main's shared service schema retained), `tests/unit/PROJ-BREAK-SA-service-query-boundaries-chat13.test.ts` |
| PROJ-BREAK-SA-34 | Revoked/changed College Admin membership cannot obtain a project row lock, write event or audit through the lock action | `src/modules/projects/admin-submission-review-service.ts`, `tests/unit/PROJ-BREAK-SA-34-admin-lock-role-revocation.test.ts` |
| PROJ-BREAK-SA-35 | Legacy Super Admin project redirect rejects learner, disabled user, invalid UUID and unauthorized foreign project before canonical summary redirect | `src/app/(authenticated)/admin/projects/[projectId]/page.tsx`, `tests/unit/PROJ-BREAK-SA-35-legacy-project-redirect.test.ts` |
| PROJ-BREAK-SA-36 | Mentor name/ID no longer presented as active after user disable even if membership remains ACTIVE | `src/modules/projects/admin-insights-service.ts`, `tests/unit/chat13-project-admin-member-tenant-isolation.test.ts`, `tests/integration/chat13-proj-break-disabled-mentor.test.ts` |

All fixes are source-authored and committed. No local CI/real DB/browser run is asserted, per the owner's defer-CI directive; actual verification and an independent different-lane review remain open.


| PROJ-BREAK-SA-37 | Admin workspace card age now accounts for ended membership transitions via a single grouped MAX timestamp query, while name projection stays restricted to active actor and college | `src/modules/projects/admin-insights-service.ts`, `tests/unit/chat13-project-admin-member-tenant-isolation.test.ts`; load/performance and database execution pending |


## 2026-10-19 adversarial continuation (source-authored, tests unrun)

- **PROJ-BREAK-SA-38:** project admin risk badges reject NaN, infinity, fractional and unsafe-integer inactivity ages without hiding valid independent blocker/review warnings; `tests/unit/PROJ-BREAK-SA-38-39-risk-activity-guards.test.ts`.
- **PROJ-BREAK-SA-39:** highest submission version rather than SQL ordering is used to decide pending review; completed/archived projects remain non-actionable; same named test.
- **PROJ-BREAK-SA-40:** a PLANNED restored project cannot display `Pending review` merely because an old version remains SUBMITTED; state predicate matches `canAdminSettleDelivery`; `tests/unit/PROJ-BREAK-SA-40-planned-submission-risk.test.ts`.
- **SA-DRIVE-ARCHIVE-04/05:** destructive drive archive explicitly denies malformed/unknown statuses, rather than assuming any non-ARCHIVED string can transition; `tests/unit/chat13-super-admin-archive-transition-matrix.test.ts`. This does not remove the two-session accepted-offer/new-offer race release gate.
- **SA-REPORT-CSV-UNICODE-06/07 and SA-ADMIN-CSV-05:** Super Admin placements analytics/accreditation, company directory and scoped CSV exports apply consistent Unicode control/format/combining/enclosing-mark formula neutralization. Tests cover hostile value and whole CSV paths. Actual spreadsheet opening and authenticated download remain unverified.
- **SA-REPORT-PACKAGE-08/09:** LOIs no longer inflate accepted full-time OFFER CTC summary, company/branch packages or detailed CTC band; raw LOI record history remains counted in offers. Tested by pure-model scenarios only; cross-report PostgreSQL reconciliation still required.

**Review limitation:** source-authored tests, no local execution, A/B Postgres, browser review or independent release signoff. Existing 28 placements + 20 projects route inventory unchanged. All source changes were confined to `chatgpt/chat-13-b`, with commit prefix `[chat-13]`; latest `main` was merged into that branch while preserving other lanes' changes. The design/card directive remains on hold.

- **PROJ-BREAK-SA-41:** `readiness-overrides-export-model.ts` now neutralizes spreadsheet formulas after Unicode combining/enclosing marks and C0 controls; full operator and benign-value matrix in `tests/unit/PROJ-BREAK-SA-41-readiness-export-formula-matrix.test.ts`. Authored without executing tests; Excel/LibreOffice import remains an acceptance check.
