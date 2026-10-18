# Placement interview, round and slot exported-function coverage — chat-2

**Status:** PARTIAL, **not release certified**. Snapshot: 2026-10-18, branch `chatgpt/chat-2-b`. This is a function-granularity ledger for the interview/round/slot files inspected so far, with explicit holes. “UNIT WRITTEN” and “PARTIAL” do **not** mean passed: this connector-only session cannot execute Vitest, TypeScript or the PostgreSQL harness.

## Evidence gates

- Security: wrong tenant/role/expired session must be rejected by permission checks before business reads/writes; all non-idempotent writes require same-origin and transaction-safe expected versions.
- Concurrency: PostgreSQL transaction locks + double-submit tests must prove one booking, one result state transition and one notification.
- Integrity: preserve IST scheduling, FK/tenant scope, immutable applied round evidence, slot booking constraints, audit record consistency, no leaked candidate contacts in exports.
- Every **GAP** row below requires a direct behavioural test and a fixture-backed adversarial test for its write paths, not a source-string mention, before the IIT Dharwad release gate.

## Exported-function ledger

| Module | Exported symbol | Closest test evidence | Gate |
| --- | --- | --- | --- |
| `src/modules/placements/tpo-interview-slot-model.ts` | `tpoInterviewSlotActionSchema` | `tests/unit/chat2-tpo-interview-plan-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-interview-slot-model.ts` | `sameInterviewRoom` | `tests/unit/chat2-tpo-interview-plan-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-interview-slot-model.ts` | `planInterviewDay` | `tests/unit/chat2-tpo-interview-plan-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-interview-slot-service.ts` | `getTpoInterviewSlotWorkspace` | `tests/integration/chat2-tpo-interview-slot-db-constraints.test.ts` | PARTIAL (DB constraints only, service calls untested) |
| `src/modules/placements/tpo-interview-slot-service.ts` | `mutateTpoInterviewSlots` | `tests/integration/chat2-tpo-interview-slot-db-constraints.test.ts` | PARTIAL (DB constraints only, service calls untested) |
| `src/modules/placements/tpo-interview-reschedule-model.ts` | `tpoInterviewRescheduleSchema` | `tests/unit/chat2-tpo-interview-plan-break-01.test.ts` | PARTIAL (window/overlap tests, schema untested) |
| `src/modules/placements/tpo-interview-reschedule-model.ts` | `validInterviewWindow` | `tests/unit/chat2-tpo-interview-plan-break-01.test.ts` | PARTIAL (window/overlap tests, schema untested) |
| `src/modules/placements/tpo-interview-reschedule-model.ts` | `overlappingInterviewVenue` | `tests/unit/chat2-tpo-interview-plan-break-01.test.ts` | PARTIAL (window/overlap tests, schema untested) |
| `src/modules/placements/tpo-interview-reschedule-service.ts` | `rescheduleTpoInterview` | **No direct behavioural test** | GAP (DB integration/role/tenant/race) |
| `src/modules/placements/tpo-round-apply-model.ts` | `roundApplyInputSchema` | `tests/unit/chat2-tpo-round-state-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-round-apply-model.ts` | `summarizeRoundApply` | `tests/unit/chat2-tpo-round-state-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-round-apply-model.ts` | `roundApplyPreviewToken` | `tests/unit/chat2-tpo-round-state-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-round-apply-service.ts` | `getTpoRoundApplyPreview` | **No direct behavioural test** | GAP (transaction, stale-preview, individual failure semantics) |
| `src/modules/placements/tpo-round-apply-service.ts` | `applyTpoWholeRound` | **No direct behavioural test** | GAP (transaction, stale-preview, individual failure semantics) |
| `src/modules/placements/tpo-round-calendar-model.ts` | `tpoRoundCalendarMutationSchema` | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` | PARTIAL |
| `src/modules/placements/tpo-round-calendar-model.ts` | `parseIstRoundLocalTime` | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` | PARTIAL |
| `src/modules/placements/tpo-round-calendar-service.ts` | `listTpoCalendarRoundChoices` | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` | PARTIAL (source/model, no DB race) |
| `src/modules/placements/tpo-round-calendar-service.ts` | `decideTpoCalendarRound` | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` | PARTIAL (source/model, no DB race) |
| `src/modules/placements/tpo-round-import-model.ts` | `roundImportActionSchema` | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` | PARTIAL |
| `src/modules/placements/tpo-round-import-model.ts` | `parseTpoRoundImport` | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` | PARTIAL |
| `src/modules/placements/tpo-round-import-model.ts` | `ROUND_IMPORT_TEMPLATE` | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` | PARTIAL |
| `src/modules/placements/tpo-round-import-model.ts` | `matchTpoRoundImportRoster` | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` | UNIT WRITTEN (CI pending; contradictory-identity behavioral cases) |
| `src/modules/placements/tpo-round-import-preview-token.ts` | `tpoRoundImportPreviewToken` | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` | UNIT WRITTEN (CI pending; stale file/roster/result behavioral cases) |
| `src/modules/placements/tpo-round-import-service.ts` | `previewTpoRoundImport` | **No direct behavioural test** | GAP (actual tenant/CSV rejection/transaction) |
| `src/modules/placements/tpo-round-import-service.ts` | `stageTpoRoundImport` | **No direct behavioural test** | GAP (actual tenant/CSV rejection/transaction) |
| `src/modules/placements/tpo-round-reorder-model.ts` | `roundReorderLockMessage` | `tests/unit/chat2-tpo-round-state-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-round-reorder-model.ts` | `moveRound` | `tests/unit/chat2-tpo-round-state-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/round-service.ts` | `listPlacementRounds` | **No direct behavioural test** | GAP (role, tenancy, state and races) |
| `src/modules/placements/round-service.ts` | `getPlacementRound` | **No direct behavioural test** | GAP (role, tenancy, state and races) |
| `src/modules/placements/round-service.ts` | `createPlacementRound` | **No direct behavioural test** | GAP (role, tenancy, state and races) |
| `src/modules/placements/round-service.ts` | `updatePlacementRound` | **No direct behavioural test** | GAP (role, tenancy, state and races) |
| `src/modules/placements/round-service.ts` | `actOnPlacementRound` | **No direct behavioural test** | GAP (role, tenancy, state and races) |
| `src/modules/placements/round-service.ts` | `getTpoRoundReorderReadiness` | **No direct behavioural test** | GAP (role, tenancy, state and races) |
| `src/modules/placements/round-service.ts` | `reorderPlacementRounds` | **No direct behavioural test** | GAP (role, tenancy, state and races) |
| `src/modules/placements/round-venue-booking-service.ts` | `requireAvailableRoundVenue` | **No direct behavioural test** | GAP (two-session advisory lock race) |
| `src/modules/placements/tpo-interview-readiness-model.ts` | `tpoInterviewWindowSchema` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-interview-readiness-model.ts` | `projectTpoInterviewReadiness` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-interview-readiness-service.ts` | `getTpoInterviewReadiness` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-recruiter-slot-review-service.ts` | `listTpoRecruiterProposedSlots` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-result-table-model.ts` | `tpoRoundResultTableQuerySchema` | `tests/unit/chat2-round-uncovered-pure-models.test.ts` | UNIT WRITTEN (not run) |
| `src/modules/placements/tpo-round-result-table-model.ts` | `projectTpoRoundResultTable` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-round-result-table-model.ts` | `tpoRoundResultViewSchema` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-round-result-table-model.ts` | `filterTpoRoundResultRows` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-round-result-table-service.ts` | `getTpoRoundResultTable` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `TPO_ROUND_ATTENDANCE_STATES` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `buildTpoRoundDriveDayRoster` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-round-drive-day-service.ts` | `getTpoRoundDriveDay` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-facts-model.ts` | `projectTpoRoundFacts` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-round-failure-csv-model.ts` | `tpoRoundFailureCsvQuerySchema` | `tests/unit/chat2-round-uncovered-pure-models.test.ts` | UNIT WRITTEN (not run) |
| `src/modules/placements/tpo-round-failure-csv-model.ts` | `tpoRoundFailureCsv` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-round-apply-csv-model.ts` | `roundApplyPreviewCsv` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-apply-csv-model.ts` | `roundApplyReportCsv` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-result-entry-model.ts` | `tpoRoundResultEntryFormSchema` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `bulkTpoRoundResultSchema` | `tests/unit/chat2-round-uncovered-pure-models.test.ts` | UNIT WRITTEN (not run) |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `summarizeBulkRoundResults` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `resolveBulkRoundLearnerTokens` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-bulk-round-result-service.ts` | `confirmTpoBulkRoundResults` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `confirmedTpoRoundResultSchema` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `TPO_RESULT_LABELS` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `canEditTpoRoundResult` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `canApplyTpoRoundResult` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-confirmed-round-result-service.ts` | `confirmTpoRoundResult` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-live-round-search-model.ts` | `tpoLiveRoundSearchSchema` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-live-round-search-model.ts` | `filterTpoLiveRoundSearch` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-live-round-job-link-model.ts` | `tpoLiveRoundJobHref` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-live-round-timing-model.ts` | `tpoLiveRoundTiming` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-live-round-venue-model.ts` | `tpoLiveRoundVenueLabel` | `tests/unit/chat2-tpo-round-uncovered-models-break-13.test.ts` | UNIT WRITTEN (CI pending) |
| `src/modules/placements/tpo-failure-round-share-model.ts` | `summarizeFailedRoundShares` | `tests/unit/chat2-round-uncovered-pure-models.test.ts` | UNIT WRITTEN (not run) |
| `src/modules/placements/tpo-failure-round-share-model.ts` | `summarizeFailedRoundSharesByBranch` | `tests/unit/chat2-round-uncovered-pure-models.test.ts` | UNIT WRITTEN (not run) |
| `src/modules/placements/college-interview-action-model.ts` | `collegeInterviewActionSchema` | **No direct behavioural test** | GAP (College/Admin cross-account) |
| `src/modules/placements/college-interview-action-service.ts` | `getCollegeInterviewAppointments` | **No direct behavioural test** | GAP (College/Admin cross-account) |
| `src/modules/placements/college-interview-action-service.ts` | `mutateCollegeInterview` | **No direct behavioural test** | GAP (College/Admin cross-account) |
| `src/modules/placements/college-round-slot-action-service.ts` | `getCollegeRoundSlotAppointments` | **No direct behavioural test** | GAP (College/Admin cross-account) |
| `src/modules/placements/college-round-slot-action-service.ts` | `mutateCollegeRoundSlotInterview` | **No direct behavioural test** | GAP (College/Admin cross-account) |
| `src/modules/placements/college-interview-directory-service.ts` | `collegeInterviewFilters` | **No direct behavioural test** | GAP (College/Admin cross-account) |
| `src/modules/placements/college-interview-directory-service.ts` | `listCollegeInterviewDirectory` | **No direct behavioural test** | GAP (College/Admin cross-account) |

## Cross-cutting evidence already added

- `TPO-BREAK-interview-01`: malformed direct planner input, overlong/invalid slot counts, duplicate normalized rooms, time zone boundary, opaque form schema, fail-closed collisions.
- `TPO-BREAK-interview-PG-01`: real PostgreSQL partial unique indexes, composite round/job FK across tenants, stale versions, booking shape, savepoint rollback. Requires disposable `TEST_DATABASE_URL`.
- `TPO-BREAK-round-01`: locked reorder, negative/fractional/out-of-range reorder indices, prototype-property outcome injection, stale round preview token and explicit apply confirmation.
- `TPO-BREAK-venue-PG-01`: two independent PostgreSQL transactions verify that the same college/venue advisory lock is exclusive; service wiring checks ensure calendar and reschedule both invoke the common guard.
- Existing `chat2-ledger-round-import-and-scheduling.test.ts` covers some parser/model contracts but cannot substitute for transaction/route/role tests.
- Activity audit added for slot generation/clearing, cancel-unbooked and change-room-unassigned; duplicate room changes have no side effect.

## Remaining release blockers

1. **Missing DB service invocation tests** for all TPO/College/HR paths: especially round state transition, candidate booking, learner notification, stale pages and rollback.
2. **Cross-writer venue serialization**: calendar scheduling delegates to `actOnPlacementRound`, which uses `requireAvailableRoundVenue` under an advisory xact lock, as does reschedule. The new `tests/integration/chat2-tpo-round-venue-races.test.ts` checks two-session advisory locking, but simultaneous *full service invocation* still needs a disposable test DB fixture and behavioral test.
3. **Race-free public-facing TPO pages:** last-third route loading/empty/error/partial/denied/phone coverage separate from this ledger.
4. **No local execution** in the available GitHub connector environment; CI must run `tsc`, Vitest and disposable PostgreSQL integration suite.

Use this ledger to assign next writes. Do not convert a GAP to complete based on a source-string assertion.

## Pass B follow-up (2026-10-18)

- `chat2-tpo-round-model-break-02.test.ts` now checks malformed interview time windows, cancelled interview omission, uncertain durations, roster duplicate/ambiguous identities, stale round-result edit constraints, malformed bulk paste and CSV formula escaping.
- `chat2-tpo-last-third-route-matrix.test.ts` enumerates each of the **42 distinct** last-third TPO routes (85–126), verifies tenant-guard inheritance and shared loading/error fallback, and adds report/settings-specific source contracts. It is **source-level only**; browser/role test evidence still needed per route.
- Previous `chat2-ledger-round-import-and-scheduling.test.ts` CSV supported-type test has its production wording corrected without weakening its rejection rule.
- These tests were authored but cannot be represented as passing without cloud CI. Full integration and double-submit actor-journey coverage remain open.

## Pass B – route-level and all-export coverage increment

- `docs/audit/coverage/placements-interviews-rounds-slots-all-exports-chat2.md` now inventories **all 71** matching `*interview*`, `*round*`, `*slot*` module files, including HR/recruiter, college, learner, Super Admin and TPO. All named exported runtime functions have an explicit test or a conspicuous **NO DIRECT BEHAVIOURAL TEST — GAP** entry; TypeScript-only declarations are noted separately. This is a complete *inventory*, not a completed behavioral coverage certification.
- `tests/unit/chat2-tpo-round-route-journeys-break-04.test.ts` imports actual TPO interview-reschedule, confirmed-round and bulk-confirmed-round POST handlers, and exercises forged origin, persisted actor versus body spoofing, simulated stale/expired/wrong-tenant failures, and migration guard.
- `tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts` covers failure-report deduplication, Excel formula shielding, bounded live interview timing, link encoding, search and strict result staging.
- `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` now additionally rejects scientific, hexadecimal, fractional, zero and overflow waitlist ranks.
- `tests/unit/PROJ-BREAK-TPO-ROLE-01.test.ts` protects IIT Dharwad Projects role isolation: TPO scoped read only, no project mutations, deny wrong college/organization and inactive sessions, recruiter grant does not imply Projects access.
- **OPEN:** direct DB-backed role/service journey coverage for remaining exported services, cloud typecheck+unit+PG integration execution, and phone/browser route state validation.

## Follow-up: round result CSV review race (2026-10-18)

- `TPO-drive-workspace-40`: `tpoRoundImportPreviewToken` now binds the uploaded bytes, round identity, current applicant list, current result IDs/statuses, email, roll and name into a deterministic SHA-256 review token; reordering an unchanged roster does not stale it.
- `stageTpoRoundImport` re-reads the actor-scoped roster and round state **after** preview validation and refuses to write if the source/roster token or scheduling eligibility changed between the two reads. This closes one avoidable preview-to-stage time-of-check/time-of-use window. Per-result optimistic checks remain in `confirmTpoRoundResult`.
- `parseTpoRoundImport` clears rank on PASS, FAIL and ABSENT rows, even when an unexpected numeric rank was supplied; the row continues to be flagged invalid for explicit officer review.
- Regression evidence: `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts`, including `TPO-drive-workspace-40 refuses a stale review when the file, roster, or persisted result changes`. Tests were authored, **not executed**. Real two-actor PostgreSQL races and cloud CI remain required; this is not a complete integration proof.

## Identity mapping and server-only preview-token split

The all-column applicant matching function is now exported from the browser-safe round-import model and reused in both preview and staging. It rejects IDs whose email/roll data contradict the selected internal applicant and never trusts company portal IDs for identity. The SHA-256 `tpoRoundImportPreviewToken` lives in the **server-only** `tpo-round-import-preview-token.ts`, not the import parsing model; this avoids pulling Node crypto into a possible client import graph. Both helpers have direct named tests. They have not been executed, and parallel database writers still need integration tests.

## Chat-2 follow-up: post-merge CI failure triage and slot/round coverage — 2026-10-18

All evidence below is **authored source, not an executed pass**. The main CI report `docs/orchestrator/typecheck-errors-latest.md` presently lists production typecheck and lint PASS; its remaining errors refer to other lane test files. No tests or TypeScript checks were executed in this session.

| Module and exported symbol | Direct behavioural evidence | Scope / remaining gate |
| --- | --- | --- |
| `tpo-interview-reschedule-model.ts` — `tpoInterviewRescheduleSchema` | `tests/unit/chat2-interview-reschedule-security.test.ts` — `TPO-drive-workspace-44 accepts only secure, credential-free virtual interview links`, `TPO-drive-workspace-44 rejects forged/partial reschedules and requires an on-campus venue` | HTTPS-only virtual meeting link, credential rejection, schema strictness; actual database reschedule races remain open |
| `tpo-interview-reschedule-model.ts` — `validInterviewWindow`, `overlappingInterviewVenue` | `tests/unit/chat2-interview-reschedule-security.test.ts` — invalid durations, start instants and touching/overlapping bookings | Real PostgreSQL competing-slot transaction remains open |
| `tpo-interview-slot-model.ts` — `tpoInterviewSlotActionSchema`, `planInterviewDay`, `sameInterviewRoom`, `overlapsInterviewRoom` | `tests/unit/chat2-tpo-interview-round-slot-ledger.test.ts` — `TPO-drive-workspace-44` schema, bounded planner, Unicode collisions | Generated room/day model only; service concurrent mutation remains open |
| `tpo-round-reorder-model.ts` — `roundReorderLockMessage`, `moveRound` | `tests/unit/chat2-tpo-interview-round-slot-ledger.test.ts` — `TPO-drive-workspace-37 never reorders ended, live or artifact-bearing plans` | Mutating round-service PostgreSQL race remains open |
| `tpo-live-round-timing-model.ts` — `tpoLiveRoundTiming` | `tests/unit/chat2-tpo-interview-round-slot-ledger.test.ts` — `UX-tpo-LAST-THIRD-01 never invents elapsed time for future or invalid clocks` | Model-only, not browser render verification |
| `tpo-confirmed-round-result-model.ts` — `confirmedTpoRoundResultSchema` | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` — `single result requires an explicit confirm, current version and strictly validated learner decision` (corrected invalid unmessaged FAIL fixture) | Staging/apply transaction still awaits CI/DB |

**Open:** direct live service role/tenant/revocation tests, transaction rollback, idempotent retries, notification exactly-once, and browser routes’ states. No completeness or CI-green claim is made.

## 2026-10-18 service and import-confirmation follow-up

| Entry point | Direct test and cases | Status |
| --- | --- | --- |
| `rescheduleTpoInterview` in `tpo-interview-reschedule-service.ts` | `tests/unit/chat2-reschedule-interview-service-races.test.ts`: revoked access before DB, hostile IDs/payload, round not editable, stale expectedUpdatedAt, lost compare-and-swap, venue unavailability and one event + one college audit after success | UNIT AUTHORED, CI pending; PostgreSQL two-session race and notification coverage open |
| `getTpoInterviewSlotWorkspace` and `mutateTpoInterviewSlots` in `tpo-interview-slot-service.ts` | `tests/unit/chat2-tpo-interview-round-slot-ledger.test.ts` checks active membership/user joins on roster, BOOK and MOVE_REQUEST, plus booked-slot version CAS before any notice | SOURCE GUARD AUTHORED; direct service/PG behaviors open |
| `round-service.ts`: `listPlacementRounds`, `getPlacementRound`, `createPlacementRound`, `updatePlacementRound`, `actOnPlacementRound`, `getTpoRoundReorderReadiness`, `reorderPlacementRounds` | `tests/unit/chat2-round-service-authorization-boundaries.test.ts`: malformed IDs/commands, duplicate round order, foreign-college authorization denial ahead of transaction | UNIT AUTHORED; allowed transitions/DB races open |
| `POST /api/placements/tpo/jobs/[jobId]/rounds/[roundId]/import-results` | `tests/unit/chat2-tpo-round-import-route-confirmation.test.ts`: foreign origin, preview, explicit staging consent, additional missing-candidate consent, invalid action and correct service command | UNIT AUTHORED, CI pending |

The import endpoint previously constructed `confirmed:true` on the server even if the POST supplied no confirmation field. The route now rejects staging without an explicit `confirmed=true` form field, and mass marking Not cleared requires a separate acknowledgement. `src/components/placements/tpo-round-results-import.tsx` sends both flags after the confirmation UI. No test was removed or weakened.

## Interview/round API and graceful mutation pass — 2026-10-18

| Route/component | Behavioral test | Security and resilience notes |
| --- | --- | --- |
| `GET/POST /api/placements/tpo/jobs/[jobId]/rounds/[roundId]/interview-slots` | `tests/unit/chat2-tpo-interview-slot-route-journeys.test.ts` | GET no-store and scoped, POST origin checked before session, unchanged explicit optimistic version passed to validated mutation, errors mapped without internal hostnames |
| `POST /api/placements/tpo/interviews/[roundId]/reschedule` | `tests/unit/chat2-tpo-interview-reschedule-route-ui.test.ts` | Origin check, unavailable migration actionable 503, service actor and request propagation, safe error mapping |
| `TpoInterviewRescheduleForm` | `tests/unit/chat2-tpo-interview-reschedule-route-ui.test.ts` | Shared ConfirmDialog in place of `window.confirm`, submitted inputs retained in ref, guarded duplicate action, UI renders sanitized API `message` rather than raw `error` code |

These unit/source checks are committed but unexecuted. HTTP session revocation and service PostgreSQL race tests remain open; no claims of end-to-end verification.

## 2026-10-19 chat-2 round action concurrency follow-up

| Export / boundary | Test | Cases and release limitations |
| --- | --- | --- |
| `roundActionSnapshotMatches` | `tests/unit/chat2-round-action-concurrency.test.ts` | Exact status, optional revision, stale reschedule within same status, invalid revision, missing/invalid locked rows |
| `roundActionJobMutable` | `tests/unit/chat2-round-action-concurrency.test.ts` | PUBLISHED/DRAFT allowed; CLOSED, ARCHIVED, missing locks denied |
| `round-service.ts` `updatePlacementRound`, `actOnPlacementRound` | `tests/unit/chat2-round-action-concurrency.test.ts` | Source contract confirms job row lock before all writes; schedule, complete and cancel recheck locked version; completion audit; monotonic updatedAt; **direct PostgreSQL service transaction tests still required** |
| `tpo-failure-round-share-model.ts` both summarizers | `tests/unit/chat2-round-uncovered-pure-models.test.ts` | Duplicate joined decisions, applied denominator, missing active branch, immutability |
| `tpo-bulk-round-result-model.ts` schema | `tests/unit/chat2-round-uncovered-pure-models.test.ts` | Explicit confirmation, rank collision, duplicate application, 25-row cap, result CAS identity, tenant injection denial |
| `hr-drive-round-presets.ts`, `hr-inline-round-results-model.ts`, `hr-round-schedule-model.ts` exports | `tests/unit/chat2-round-uncovered-pure-models.test.ts` | Clone-safe presets, valid URLs, overlap and touching intervals, filter counts |

**Not complete:** all PostgreSQL service role/tenant/race tests and all TPO page state cases remain open. Source-contract assertions do not prove runtime transaction isolation.

## 2026-10-19 direct PostgreSQL round-action integration

`tests/integration/chat2-round-action-locking-postgres.test.ts` (written, **not run**) exercises actual `actOnPlacementRound`, `getPlacementRound`, `updatePlacementRound` against a seeded disposable DB09 PostgreSQL connection: schedule and reschedule; stale COMPLETE and CANCEL both denied without round events; successful completion with one activity audit; late duplicate completion rejected; wrong-college caller denied; direct closed-job edit/cancel denied, no events. Tests use isolated test database guard and clean fixture-owned rows. This closes the **direct-service-test-absent** part of the round-action row only for these cases. It does not cover all permissions, transaction faults, simultaneous sessions, venues, reorders or slots.
