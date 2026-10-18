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
| `src/modules/placements/tpo-interview-readiness-model.ts` | `tpoInterviewWindowSchema` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-interview-readiness-model.ts` | `projectTpoInterviewReadiness` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-interview-readiness-service.ts` | `getTpoInterviewReadiness` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-recruiter-slot-review-service.ts` | `listTpoRecruiterProposedSlots` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-result-table-model.ts` | `tpoRoundResultTableQuerySchema` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-result-table-model.ts` | `projectTpoRoundResultTable` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-result-table-model.ts` | `tpoRoundResultViewSchema` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-result-table-model.ts` | `filterTpoRoundResultRows` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-result-table-service.ts` | `getTpoRoundResultTable` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `TPO_ROUND_ATTENDANCE_STATES` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `buildTpoRoundDriveDayRoster` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-drive-day-service.ts` | `getTpoRoundDriveDay` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-facts-model.ts` | `projectTpoRoundFacts` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-failure-csv-model.ts` | `tpoRoundFailureCsvQuerySchema` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-failure-csv-model.ts` | `tpoRoundFailureCsv` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-apply-csv-model.ts` | `roundApplyPreviewCsv` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-apply-csv-model.ts` | `roundApplyReportCsv` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-round-result-entry-model.ts` | `tpoRoundResultEntryFormSchema` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `bulkTpoRoundResultSchema` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `summarizeBulkRoundResults` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `resolveBulkRoundLearnerTokens` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-bulk-round-result-service.ts` | `confirmTpoBulkRoundResults` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `confirmedTpoRoundResultSchema` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `TPO_RESULT_LABELS` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `canEditTpoRoundResult` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `canApplyTpoRoundResult` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-confirmed-round-result-service.ts` | `confirmTpoRoundResult` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-live-round-search-model.ts` | `tpoLiveRoundSearchSchema` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-live-round-search-model.ts` | `filterTpoLiveRoundSearch` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-live-round-job-link-model.ts` | `tpoLiveRoundJobHref` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-live-round-timing-model.ts` | `tpoLiveRoundTiming` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-live-round-venue-model.ts` | `tpoLiveRoundVenueLabel` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-failure-round-share-model.ts` | `summarizeFailedRoundShares` | **No direct behavioural test** | GAP |
| `src/modules/placements/tpo-failure-round-share-model.ts` | `summarizeFailedRoundSharesByBranch` | **No direct behavioural test** | GAP |
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
- Existing `chat2-ledger-round-import-and-scheduling.test.ts` covers some parser/model contracts but cannot substitute for transaction/route/role tests.
- Activity audit added for slot generation/clearing, cancel-unbooked and change-room-unassigned; duplicate room changes have no side effect.

## Remaining release blockers

1. **Missing DB service invocation tests** for all TPO/College/HR paths: especially round state transition, candidate booking, learner notification, stale pages and rollback.
2. **Cross-writer venue serialization**: `decideTpoCalendarRound` uses a projection conflict check while reschedule uses advisory xact locks; must test simultaneous calendar/reschedule writes before calling venue safety complete.
3. **Race-free public-facing TPO pages:** last-third route loading/empty/error/partial/denied/phone coverage separate from this ledger.
4. **No local execution** in the available GitHub connector environment; CI must run `tsc`, Vitest and disposable PostgreSQL integration suite.

Use this ledger to assign next writes. Do not convert a GAP to complete based on a source-string assertion.
