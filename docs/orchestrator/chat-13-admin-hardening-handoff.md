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
