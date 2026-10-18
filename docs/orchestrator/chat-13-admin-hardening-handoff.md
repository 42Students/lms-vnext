# chat-13 — Super Admin + Placements admin hardening handoff

**Branch:** `chatgpt/chat-13-b`  
**Date:** 2026-10-18 IST  
**Scope:** `docs/orchestrator/queues/master-queue.md` chat-13 items 1 and 2.  
**Status:** Source audit, corrections and test authoring complete for the enumerated scope. CI, real PostgreSQL and browser execution **not verified**; this is not a deployment or security sign-off.

## Item 1 — Super Admin /admin pages, Placements and Projects

- First 37 `/admin` routes: `tests/unit/chat13-admin-first-third-audit.test.ts` enumerates and tests authenticated context plus source UX/safety contracts. Main route manifest: `docs/orchestrator/ui-ux/pages-admin.md`.
- 48 current Super Admin Projects + Placements page routes: `tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts` checks delegated dynamic IDs, scoped persisted project ownership and route surfaces. Supplemental adversarial `PROJ-BREAK-SA-09..32` test suites cover state, invalid filters, tenant mentor labels, literal SQL search, audits and exports.
- Exact gap IDs, evidence, status and remaining runtime checks: `docs/audit/acceptance/superadmin-placements-projects-a-placements-verification.md`, `docs/audit/coverage/chat13-superadmin-placements-projects-page-audit.md` and `docs/orchestrator/queues/gap-closure-chat-13.md`.
- Independent break-it fixes in this continuation: `SA-DRIVE-ARCHIVE-NOTIFY-05`, `SA-HIRING-REPORT-SCOPE-03`, `SA-HIRING-ACADEMIC-04`, `SA-PIPELINE-TENANT-02`, `SA-SCOPED-CSV-CAP-05`, `SA-APPLICATIONS-ACADEMIC-05`. Earlier same-lane work: `PROJ-BREAK-SA-30/31/32` and booked interview tenancy hardening.

## Item 2 — Admin placement services, analytics and exports

- `tests/unit/chat13-placements-admin-coverage-registry.test.ts` enumerates all **38** dedicated `admin-*`, `super-admin-*`, `report-*` and `platform-placement-policy-*` modules under `src/modules/placements` and requires coverage-ledger entries for every one.
- `tests/unit/chat13-admin-ui-placements-tenant-matrix.test.ts` audits the other **13** Super Admin placement readers and CSV services under `src/modules/admin-ui` for central selected-college authorization, job/member scope, and export caps.
- `tests/unit/chat13-super-admin-hiring-report-tenant-aggregation.test.ts` and `chat13-super-admin-pipeline-tenant.test.ts` assert candidate membership college filters are applied before pipeline aggregation. `tests/integration/chat13-super-admin-aggregate-tenant.test.ts` is an authored rollback-isolated PostgreSQL two-college malformed-application witness.
- `tests/unit/chat13-scoped-csv-export-page-size.test.ts` exercises the actual scoped export entrypoint using mocked authorization and loaders: URL page sizes 10/100 must still fetch exactly 25 x 10 pages for the 250-row cap, preserve warnings, and deny unauthorized status filters.
- The detailed per-service ledger is `docs/audit/coverage/placements-admin-chat13-ledger.md`; independent defect IDs, severity and explanations are `docs/audit/defects-chat-13.md`.

## CI status and remaining external verification

- The latest `docs/orchestrator/unit-failures-latest.md` available to this lane remains the older `ff6819dd/698eb9dd` report. Its chat-13 `SA-placements-projects-09` and `UX-cross-tpo-second-C13-026-22`, plus shared `PROJ-BREAK-SA-16/19/26`, now have matching source/test contracts on this branch, but no fresh CI result proves they pass.
- `docs/orchestrator/typecheck-errors-latest.md` reports production typecheck and lint passing at its older snapshot, with no chat-13-owned entries. This is not a fresh TypeScript verification for the new commits.
- The GitHub Actions CI runs visible when preparing this handoff were queued, not complete. No local Vitest, lint, `tsc`, browser or PostgreSQL execution was performed by this lane, per lane rules.
- Before release, the orchestrator must run the current unit suite, full TypeScript/lint, `test:db:projects-harness`, multi-tenant route/API sessions, two-session placement archive/offer acceptance, cohort contradiction, notification delivery isolation, and account/browser accessibility checks. A source assertion is not evidence that a production database is correctly migrated.
- Provider/DLT SMS activation, manual audited GitHub findings synchronization, private malware-scanned storage and inbound mail credentials remain separate operational dependencies in `docs/orchestrator/queues/gap-closure-chat-13.md`. Those dependencies are **not** marked production-ready by this service audit.

All source changes were committed/pushed only to the named chat-13 branch. This file does not assert cloud CI green, 90% branch coverage, deployed schema or production readiness.


## Latest chat-13 follow-up: refreshed CI report `ff6819dd / 698eb9dd`

The refreshed unit-failure report lists three chat-13 tests. Each was reconciled against current implementation, retaining behavioral guarantees instead of deleting or skipping tests:

| Failure ID | Repair | Evidence |
|---|---|---|
| `SA-placements-projects-56` | `ClassTeamWorkspaceCreator` now delegates per-learner rows to `DataTable` and exports via `classTeamCreationOutcomeCsv`; assertions updated to follow both source paths, then extended with an actual CSV projection verifying exact CREATED/ALREADY_COVERED rows, formula safety and CRLF line endings. | `tests/unit/chat13-cohort-creation-outcomes-gap56.test.ts`; source `src/components/projects/class-team-workspace-creator.tsx`, `src/modules/projects/class-team-creation-outcome-export.ts` |
| `SA-STUDENT-LOOKUP-CAP-01` | Service reuses `visiblePeople` instead of repeating the earlier `capStudentLookupRows(...).items.map` expression. Source regression now checks the bounded assignment and actual use, including order by display name/membership ID before the 16th-row probe (`SA-STUDENT-LOOKUP-STABLE-06`). | `tests/unit/chat13-student-placement-lookup-cap.test.ts` |
| `GR-39` | Responsive table is delegated to `DataTable` and its keyboard-accessible horizontal `ScrollCue` instead of a hardcoded `min-w-[55rem]` class on the page. Assertions now check actual shared scroll container and fade visibility. | `tests/unit/chat13-superadmin-interview-operations.test.ts` |
| `SA-PLACEMENT-POLICY-07` (test-file TS2367) | A deliberately impossible string literal compared to a finite union of keys generated a TypeScript warning. Typed assertion now verifies that no returned key serializes to the unrelated stored setting without misleading impossible literal equality. | `tests/unit/chat13-platform-placement-policy-read-service.test.ts` |

Additional remaining master-queue defect `SA-TARGET-REVOKE-07` was fixed by persisted authorization inside the atomic DRAFT cohort retarget transaction; `tests/unit/chat13-placement-target-stale-role.test.ts` asserts the permission and scope ordering. Published audience changes are deliberately denied, not claimed complete: safe applicant notices/outbox plus registered schema are still absent. `SA-placements-projects-13` therefore remains **PARTIAL** beyond published descriptive field edits.

Static pre-push review of this lane's changed TS/TSX sources reported balanced delimiters in a comment/string-aware scan and no newline inserted immediately before an `as` cast. This is not an AST parse, TypeScript build, runtime unit or PostgreSQL verification. CI still uses the older report; no latest passing result has been received.


## Further continuation — defect closure after refreshed report

- `SA-COMPANY-HISTORY-PLACED-07`: corrected "hired" totals in `admin-company-drive-history-service.ts` to require **both** ACCEPTED offer and JOINED outcome for a unique authorized application. `chat13-company-drive-history-visible-totals.test.ts` checks status predicates. Defect, acceptance and service ledger updated.
- `SA-TARGET-REVOKE-07`: added `chat13-placement-target-revocation-runtime.test.ts` with mocked transaction to verify a stale/revoked role fails **before** any selected-college cohort read, delete or insertion. Malformed UUID and duplicate cohort IDs are also denied before database access. This does not make published audience edits safe; they remain disabled.
- `SA-placements-projects-13-409`: published edit now uses domain `PlacementsServiceError` for stale versions, invalid deadline, inactive season, missing role and duplicate role title rather than an unhandled HTTP 500. Equivalent timezone representations are compared as epoch milliseconds but persisted CAS still uses `date_trunc('milliseconds',updated_at)`. The form converts trusted typed codes to friendly, actionable messages and keeps its inputs after conflict. Regression in `tests/unit/chat13-published-drive-edit.test.ts`.

Unit-failure report `ff6819dd/698eb9dd` and typecheck report `39270260` remain older than the branch implementation. Previous chat-13 failures and its `TS2367` have corresponding source-corrected regression tests, but none are certified as passing by that old report. The latest unit, TypeScript, PostgreSQL, CI and browser acceptance results must be obtained by cloud CI/orchestrator. Draft cohort targeting is a staged API; no live published retargeting or unregistered table is claimed production-ready.


## Latest continuation: tenant-safe directory metrics, CI regression fixtures and retention queue

- `SA-ADMIN-LEDGER-01`: reconciled the dynamic placement admin module inventory to **39** registered `admin-*`, `super-admin-*`, `report-*` and `platform-placement-policy-*` source files, all named in the coverage ledger. The unit inventory now parses all 111 manifest routes and verifies that its first 37 physical page files exist. The independent Projects/Placements source suite still audits all 48 nested pages.
- `SA-STUDENT-LOOKUP-PLACED-04` / `SA-STUDENT-LOOKUP-CAP-04`: corrected strict TypeScript fixture inference by constructing distinct typed student/detail query-return objects. Assertions retain exactly 15/16 and 100/101 row boundaries, joined history and authorization.
- `SA-BOOKED-INTERVIEWS-FIXTURE-05`: the PostgreSQL A/B booking witness now inserts required role option IDs for its applications; no longer relies on a legacy fixture helper that omits the registered `role_option_id NOT NULL` column. The two-college orphan booking assertion remains.
- `SA-COMPANY-DIRECTORY-COUNT-07`: company directory `driveCount` and `lastActiveAt` now require the job's stored college to match the selected company relationship's college as well as relationship ID. A two-tenant SQL witness inserts a deliberately inconsistent (but individually FK-valid) cross-college job relationship. Unit test and real PostgreSQL integration path are registered in `test:db:projects-harness`.
- `SA-RETENTION-STALENESS-08`: the Super Admin retention reader now displays, filters and sorts with **the same latest application/stage activity timestamp**, so the oldest 200 actual stale entries are selected before the 201st-row overflow notice, rather than sorting by obsolete application timestamps.

The latest available `docs/orchestrator/unit-failures-latest.md` still refers to CI `ff6819dd/698eb9dd`, and test-typecheck `007415ee` predates the source/test corrections. Static test text and SQL contracts were inspected; **no** cloud Vitest/TypeScript/PostgreSQL/browser pass has been observed. This lane cannot certify rollout until the orchestrator's complete CI and A/B database suite pass. Published-drive audience edits remain intentionally fail-closed pending an integrated migration and transactional applicant notifications.


## Priority-change continuation — Projects breakers, Super Admin depth, UX (2026-10-18)

The owner explicitly deferred all CI/test-failure triage until the end. This round therefore focused on the chat-13 master-queue item order and added source fixes + independently named behavioral tests, without running CI or touching failing-unit lists.

**Projects / IIT Dharwad first:**
- `PROJ-BREAK-SA-33`: strict direct-service project filters and paging in `admin-insights-service.ts`, with adversarial numeric, shape and foreign-key inputs rejected before scope/DB work (`tests/unit/PROJ-BREAK-SA-service-query-boundaries-chat13.test.ts`).
- `PROJ-BREAK-SA-34`: persisted College Admin lock identity checked before project/submission row locks; stale roles, changed membership, invalid reason, exact replay idempotency and altered-reason conflict cases in `tests/unit/PROJ-BREAK-SA-34-admin-lock-role-revocation.test.ts`.
- `PROJ-BREAK-SA-35`: legacy `/admin/projects/[projectId]` route now authorizes active Super Admin, validates UUID and checks persisted project/college ownership before redirect; `tests/unit/PROJ-BREAK-SA-35-legacy-project-redirect.test.ts`.
- `PROJ-BREAK-SA-36/37`: active mentor display denies disabled users; separate one-row-per-project aggregate includes ended mentor changes in staleness without exposing their names. Source and `tests/unit/chat13-project-admin-member-tenant-isolation.test.ts`; rollback-only PostgreSQL `tests/integration/chat13-proj-break-disabled-mentor.test.ts` is wired to `test:db:projects-harness`.

**Admin placements and UX next:**
- `SA-JOINING-ANOMALY-09`: directory and detail show an explicit review warning when persisted JOINED outcome contradicts a non-ACCEPTED offer. Pure matrix and scoped list/detail source cases: `tests/unit/chat13-super-admin-joining-integrity.test.ts`.
- `SA-HIRING-REPORT-MODEL-10`: strict date/UUID parsing, employer-ID grouping, duplicate labels, all stage sums, empty and immutable input in `tests/unit/chat13-super-admin-hiring-report-model-behavior.test.ts`.
- `SA-ADMIN-SELECTED-COLLEGE-11`: active/disabled, wrong role, no college and dual-role scope matrix in `tests/unit/chat13-super-admin-selected-college-role-matrix.test.ts`.
- `SA-ADMIN-HISTORY-MODAL-10`: first-third Super Admin import-history overlay has focus restoration and a single bounded vertical scroller; UX contracts in `tests/unit/chat13-super-admin-history-modal-ux.test.ts`.
- `SA-DIRECTORY-QUERY-12`: shared directory filters reject hex/exponent/array/unknown URL keys and invalid UUID/status; page arithmetic remains finite and outbound URLs preserve scoped facets. `tests/unit/chat13-admin-directory-query-hardening.test.ts`.

Relevant defects and source-test traceability: `docs/audit/defects-chat-13.md`, `docs/audit/coverage/chat13-superadmin-placements-projects-page-audit.md`, `docs/audit/coverage/admin-first-chat13.md`, and `docs/audit/coverage/placements-admin-chat13-ledger.md`. All writes target `chatgpt/chat-13-b` only.

**Unresolved release/coverage gates:** A separate lane must independently review Projects fixes. Full browser/phone, PostgreSQL A/B and role-race execution, full route-handler behavioral coverage, 90%+ Projects branch coverage and final CI are still **not verified**. They are not marked DONE as runtime evidence; the owner has postponed those CI and deploy stages. Live published-drive audience retargeting with transactional applicant notices remains intentionally fail-closed rather than asserted complete.


## Additional Super Admin reporting/export source review (owner defer-CI priority)

- `SA-DIRECTORY-QUERY-12`: `src/modules/admin-ui/super-admin-read-directory-model.ts` now rejects hex/exponent numeric inputs, duplicated or unrecognized URL keys, invalid candidate/college facets and invalid sizes before page reads; page-count helper remains finite for malformed internal totals. `tests/unit/chat13-admin-directory-query-hardening.test.ts` exercises parser, URL round-trip and boundary arithmetic.
- `SA-HIRING-REPORT-MODEL-10`: `tests/unit/chat13-super-admin-hiring-report-model-behavior.test.ts` covers invalid dates/UUIDs, same-name but distinct employer IDs, all report stage sums, zero-row output and stable input.
- `SA-HIRING-EXPORT-13`: `GET /api/admin/placements/hiring-report/export` now rejects repeated job/date/academic filters instead of silently allowing `Object.fromEntries` last-key-wins behavior; `tests/unit/chat13-super-admin-hiring-export-route.test.ts` covers invalid filters before data access, valid private CSV headers and no-store response.
- `PROJ-BREAK-SA-34`: runtime lock tests now additionally cover idempotent same-actor exact-reason replay and changed-reason conflict; neither writes a duplicate event.
- `SA-JOINING-ANOMALY-09`: the joining detail service now shows the same persisted offer-status inconsistency warning as its directory, while preserving full selected-college and organization predicates.

All corresponding code and tests are committed to `chatgpt/chat-13-b`. The latest source-level delimiter and newline-before-as-cast inspection of this batch found no flagged mismatch; **this does not substitute for compilation or CI**. An independent Projects reviewer, PostgreSQL role races, browser/phone checks and final full-suite execution are still release prerequisites under the owner's no-CI-until-finished plan.
