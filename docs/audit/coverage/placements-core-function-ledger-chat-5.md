# Placements core export-by-export evidence ledger — chat-5

**Status: open/incomplete.** This is the owner-required per-export table for 12 high-risk pure-model files, 12 services and six HTTP routes, not an assertion that all 1,018 Placements module files or all 2,331 exported symbols are audited. Tests are **authored, not executed**, per the 2026-10-18 no-CI-until-final instruction. Role journey, PostgreSQL, network and page cases marked pending must not be counted as verified. Each row below has at least one named test source; this is an index of evidence rather than a branch coverage report.

## Pure policy and state-machine exports

| Source module | Exported functions and validators covered | Unit test file(s) in `tests/unit/` | Concrete behavior covered |
|---|---|---|---|
| `src/modules/placements/offer-college-rules-policy.ts` | `canReleaseAnotherHeldOffer`, `minimumOfferResponseDeadline`, `isPlacementOfferResponseExpired`, `placementOfferLockedDecisionTime`, `canReplayFinalOfferResponseAfterExpiry` | `offer-college-rules-policy.test.ts`, `chat5-placements-core-state-machines.test.ts` | held-cap/uplift, malformed policy, expiry/retry, locked-clock, IST Sunday |
| `src/modules/placements/offer-seat-capacity-policy.ts` | `hasAvailablePlacementOfferSeat`, `isPlacementIssuanceConcurrencyError` | `chat5-placement-offer-capacity.test.ts` | full seats, pending reservation, invalid counters, SQLSTATE chain |
| `src/modules/placements/tpo-drive-cancel-model.ts` | `tpoDriveCancelImpactSchema`, `tpoDriveCancelSchema`, `evaluateTpoDriveCancellation`, `isIssuedOfferCancelable` | `chat5-placements-core-extended-state-machines.test.ts`, `chat5-core-model-export-coverage.test.ts`, `chat5-tpo-closure-ux-boundary.test.ts` | strict impact/schema, reviewed snapshot, live/draft/forbidden, accepted retained |
| `src/modules/placements/tpo-drive-close-preview-model.ts` | `tpoDriveImpactCountsSchema`, `tpoDriveCloseSchema`, `evaluateTpoDriveClosure` | `chat5-core-model-export-coverage.test.ts`, `chat5-tpo-closure-ux-boundary.test.ts` | strict counts, ended season, stale snapshot, pending selections/seats |
| `src/modules/placements/tpo-drive-selection-model.ts` | `recordSelectionsSchema`, `releaseSelectionsSchema`, `summarizeSelectionRelease`, `tpoSelectionReleaseFailureMessage`, `isExactTpoSelectionReplay`, `matchesTpoSelectionReleaseRevision` | `chat5-placements-core-extended-state-machines.test.ts`, `chat5-core-model-export-coverage.test.ts` | duplicate applicant, extra/missing revision, ISO offset and terms, idempotency, safe error |
| `src/modules/placements/tpo-waitlist-promotion-model.ts` | `tpoWaitlistPromotionSchema`, `waitlistPreviewToken`, `canonicalWaitlistPreviewCollections`, `decideWaitlistReleaseSettlement` | `chat5-placements-core-extended-state-machines.test.ts` | exact preview token, stable ordering, CAS settlement, stale version, confirmation |
| `src/modules/placements/tpo-offer-lifecycle-model.ts` | `TPO_OFFER_ACTIONS`, `tpoOfferLifecycleInputSchema`, `parseTpoOfferExpiryIstInput`, `canRecordTpoActualJoiningDate`, `canRecordTpoOfferAction` | `chat5-placements-core-extended-state-machines.test.ts` | action x status matrix, joining evidence, IST time parsing, invalid datetime |
| `src/modules/placements/tpo-offer-expiry-model.ts` | `tpoOfferExpiryQuerySchema`, `isoDateInIndia`, `plusCalendarDays`, `TPO_EXPIRY_CSV_ROW_LIMIT`, `projectTpoOfferExpiryWatchlist`, `tpoOfferExpiryCsv` | `tpo-offer-expiry-model.test.ts` | IST civil dates, unknown/terminal exclusion, 200 cap, formula-safe CSV |
| `src/modules/placements/college-retention-report-policy.ts` | `COLLEGE_APPLICATION_RETENTION_DAYS`, `collegeApplicationRetentionCutoff` | `chat5-placements-retention-and-joining-followups.test.ts` | 180-day exact cutoff, invalid clock |
| `src/modules/placements/tpo-joining-followup-model.ts` | `tpoJoiningFollowupQuerySchema`, `projectTpoJoiningFollowups`, `TPO_JOINING_FOLLOWUP_CSV_LIMIT`, `tpoJoiningFollowupCsv` | `chat5-placements-retention-and-joining-followups.test.ts`, `tpo-joining-followup-model.test.ts` | join vs pending, due/missing, 7-day calendar, CSV caps and sample disclosure |
| `src/modules/placements/placement-offer-sweep-policy.ts` | `PLACEMENT_OFFER_EXPIRY_SWEEP_INTERVAL_MINUTES`, `isIssuedPlacementOfferDue`, `selectDuePlacementOfferIds` | `placement-offer-sweep-policy.test.ts`, `chat5-placements-core-state-machines.test.ts` | exact deadline, invalid clock, terminal exclusion, cadence |
| `src/modules/placements/tpo-report-url-guard.ts` | `tpoReportHasAmbiguousFilters`, `tpoReportHasRepeatedSearchParams` | `chat5-tpo-offer-url-integrity.test.ts` | repeat/unknown URL field rejection, page and export parity |

## Database services

| Source module | Exported service function(s) indexed | Test file(s) | Verified assertion surface / missing gate |
|---|---|---|---|
| `src/modules/placements/tpo-drive-selection-service.ts` | `getTpoSelectionWorkspace`, `recordTpoDriveSelections`, `verifyAndReleaseTpoSelections`, `countUnreleasedTpoSelections` | `tests/integration/placements-p8-offers.test.ts`, `tests/unit/chat5-placements-core-extended-state-machines.test.ts` | Postgres CAS/retry/IDOR; full scenario matrix still open |
| `src/modules/placements/tpo-waitlist-promotion-service.ts` | `getTpoWaitlistPreview`, `offerToNextWaitlisted` | `tests/integration/placements-p8-offers.test.ts`, `tests/unit/chat5-placements-core-extended-state-machines.test.ts` | Postgres rank, duplicate racing calls, closed season; crash mid-issuance still open |
| `src/modules/placements/tpo-offer-lifecycle-service.ts` | `recordTpoOfferLifecycle` | `tests/integration/placements-p8-offers.test.ts`, `tests/unit/chat5-placements-core-extended-state-machines.test.ts` | TPO bulk status, joining, notification/opt-out and accepted sibling cascade |
| `src/modules/placements/placement-offer-expiry-sweep-service.ts` | `sweepExpiredPlacementOffers` | `tests/integration/placements-p8-offers.test.ts`, `tests/unit/chat5-placement-offer-capacity.test.ts` | SKIP LOCKED racing, one terminal history/audit/notice; cron deployment external |
| `src/modules/placements/tpo-drive-cancel-service.ts` | `getTpoDriveCancelPreview`, `cancelTpoDriveWithPreview` | `tests/integration/db09-tpo-drive-cancel.test.ts`, `tests/unit/chat5-tpo-closure-ux-boundary.test.ts` | Postgres accepted-commitment retention, stale preview, affected records |
| `src/modules/placements/tpo-drive-close-preview-service.ts` | `getTpoDriveClosePreview`, `closeTpoDriveWithPreview` | `tests/integration/placements-p8-offers.test.ts`, `tests/unit/chat5-tpo-second-third-remaining-workflows.test.ts` | Postgres closed season, pending selection and waitlist reservations |
| `src/modules/placements/tpo-drive-offer-register-service.ts` | `getTpoDriveOfferRegister`, `getTpoDriveOfferRegisterCsv` | `tests/integration/placements-p8-offers.test.ts`, `tests/unit/tpo-drive-offer-register.test.ts` | Own/foreign tenant, status/filter parity and export |
| `src/modules/placements/tpo-offer-evidence-service.ts` | `getTpoOfferEvidence` | `tests/integration/placements-p8-offers.test.ts` | IDOR mismatched path job and actual offer, persisted event history |
| `src/modules/placements/tpo-withdrawal-escalation-service.ts` | `tpoWithdrawalEscalationWindow`, `escalatePendingWithdrawalRequests` | `tests/unit/chat5-tpo-withdrawal-escalation-edge.test.ts`, `tests/integration/placements-p8-offers.test.ts` | 24h window, malformed clock, safe errors, dedupe and active TPO |
| `src/modules/placements/college-retention-report-service.ts` | `getCollegeApplicationRetentionReport` | `tests/unit/chat5-placements-retention-and-joining-followups.test.ts` | tenant/filter and no mutation source guard; real PG anti-join test open |
| `src/modules/placements/tpo-joining-followup-service.ts` | `getTpoJoiningFollowups` | `tests/unit/chat5-placements-retention-and-joining-followups.test.ts`, `tests/integration/db09-tpo-joining-followup.test.ts` | accepted-only, saved season, 500-source cap and truthful CSV |
| `src/modules/placements/tpo-prep-readiness-derived-service.ts` | `readTpoLearnerPrepOutcomes` | `tests/unit/chat5-placements-retention-and-joining-followups.test.ts` | source table-scope contract; full PG role test pending |

## Scoped HTTP route handlers

| Route | Handlers | Test source(s) | Coverage and unresolved acceptance |
|---|---|---|---|
| `src/app/api/placements/tpo/jobs/[jobId]/selections/route.ts` | GET / POST | `tests/unit/chat5-tpo-second-third-behavior.test.ts`, `tests/integration/placements-p8-offers.test.ts` | same-origin, streaming JSON, scoped service; full HTTP role matrix pending |
| `src/app/api/placements/tpo/jobs/[jobId]/waitlist-promote/route.ts` | GET / POST | `tests/unit/chat5-tpo-second-third-behavior.test.ts`, `tests/integration/placements-p8-offers.test.ts` | same-origin, bounded body, duplicate release transaction |
| `src/app/api/placements/jobs/[jobId]/offers/lifecycle/route.ts` | POST | `tests/unit/chat5-tpo-second-third-behavior.test.ts`, `tests/integration/placements-p8-offers.test.ts` | same-origin, strict body, TPO actor, joining/cascade |
| `src/app/api/placements/tpo/jobs/[jobId]/close-preview/route.ts` | GET / POST | `tests/unit/chat5-tpo-second-third-behavior.test.ts`, `tests/integration/placements-p8-offers.test.ts` | GET read-only, same-origin POST, seat/selection close blocks |
| `src/app/api/placements/tpo/jobs/[jobId]/offers/export/route.ts` | GET | `tests/unit/chat5-tpo-offer-url-integrity.test.ts`, `tests/integration/placements-p8-offers.test.ts` | path job precedence, repeat filter rejected, tenant/export |
| `src/app/api/placements/reports/joining-followups/route.ts` | GET | `tests/unit/chat5-placements-retention-and-joining-followups.test.ts` | source truncation disclosure, scoped service; full HTTP role matrix pending |

## Unclosed scope

The master definition of exhaustive coverage also requires **every** remaining exported function and route, positive and negative role matrix, all cross-college/super-admin acting-scope attempts, state transition permutations, rollback/idempotency, audit/notification outcomes, full HTTP session tests, phone layouts, and actual PostgreSQL constraint/index behavior. This ledger intentionally does not mark those tasks done. See `docs/audit/coverage/placements-ledger-chat-5.md` for detailed case IDs and open risks.
