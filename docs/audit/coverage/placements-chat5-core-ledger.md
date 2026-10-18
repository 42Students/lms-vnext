# Placements core coverage ledger — chat-5 (partial, not certification)

**Scope:** core drive, jobs, offers, waiting list, joining outcomes and selection; **branch:** `chatgpt/chat-5-b`. The ledger explicitly distinguishes **written** regression coverage from fully verified behaviour. In this tool environment tests/typecheck could not be executed; orchestrator must run and expand them against PostgreSQL.

| Exported function / route handler | Test and meaningful case(s) | Gaps / remaining acceptance |
|---|---|---|
| `tpo-drive-lifecycle-model.evaluateTpoDriveLifecycle` | `tests/unit/chat5-placements-core-state-machines.test.ts`: `PLACEMENTS-LIFECYCLE-01/02/03`, `PLACEMENTS-CLOSE-01` wrong states, absent readiness, reopening prohibited after results/offers, close when season inactive | Integration: two competing status actions + audit |
| `tpo-drive-lifecycle-model.tpoDriveLifecycleSchema` | Same: `PLACEMENTS-LIFECYCLE-04` missing confirmation, short reason, surplus property | API origin and response mapping |
| `tpo-drive-lifecycle-model.hasSecureEmployerPortalUrl` | Same: `PLACEMENTS-LIFECYCLE-05` allowed HTTPS vs userinfo/insecure/non-absolute schemes | Whole URL validation including DNS policy |
| `tpo-drive-lifecycle-model.tpoDriveReadinessMessage` | Same: `PLACEMENTS-LIFECYCLE-02` every failed prereq maps to readable copy | Exact legacy copy comparison |
| `offer-college-rules-policy.canReleaseAnotherHeldOffer` | Same: `PLACEMENTS-HELD-01` strict cap, threshold, dream exemption, missing CTC | Tenant-scope facts and races at issuance |
| `held-offer-policy.canAddPlacementHeldOffer` | Same: `PLACEMENTS-HELD-02` LOI/declined excluded, accepted counts | Official plus outside mixed caps |
| `held-offer-policy.verifiedExternalHeldOffers` | Same: `PLACEMENTS-HELD-03` verified/revoked/unreviewed only | Review transaction with audit |
| `held-offer-policy.canShowLearnerSelfApply` | Same: `PLACEMENTS-HELD-04` denied for registration/debarment/application/deadline | Live learner identity and role |
| `offer-college-rules-policy.minimumOfferResponseDeadline` | Same: `PLACEMENTS-EXPIRY-03` Sunday boundary, invalid hours/date | Holiday-calendar convention |
| `offer-college-rules-policy.isPlacementOfferResponseExpired` | Same: `PLACEMENTS-EXPIRY-01` exact instant and invalid Date | Concurrent response vs sweep |
| `placement-expiry-staged-policy.isPlacementOfferExpiredAt` | Same: `PLACEMENTS-EXPIRY-01` exact and malformed instants | Scheduler ownership |
| `placement-offer-sweep-policy.isIssuedPlacementOfferDue` | Same: `PLACEMENTS-EXPIRY-02` exact instant and status filter | DB row lock and skip-locked races |
| `placement-offer-sweep-policy.selectDuePlacementOfferIds` | Same: `PLACEMENTS-EXPIRY-02` due-only, accepted/missing ignored | Batch cap and ordering |
| `placement-cascade-policy.parsePlacementCascadeId` | Same: `PLACEMENTS-CASCADE-01` strict correlation | Database-generated token uniqueness |
| `placement-cascade-policy.isPlacementInternship` | Same: `PLACEMENTS-CASCADE-02` mixed-case internship | Scoped offer category |
| `placement-cascade-policy.shouldKeepPlacementCascadeSibling` | Same: `PLACEMENTS-CASCADE-02` internship/dream/uplift retention | Atomic sibling withdrawal rollback |
| `placement-cascade-undo-policy.assertUndoablePlacementCascadeSnapshot` | Same: `PLACEMENTS-CASCADE-03` changed sibling, joined, foreign cascade | Integration and conflict locks |
| `offer-service.issuePlacementOffer` | `tests/integration/placements-p8-offers.test.ts`: existing issuance, idempotent retry, audit and exactly-one learner notification, rejects unready application | Other tenant, stale context, racing issuers |
| `offer-service.actOnPlacementOffer` | Same: existing accept, decline and expiry/not-ready rejection | Duplicate accept vs cascade conflict across sessions |
| `offer-service.recordPlacementJoiningOutcome` | Same: `PLACEMENTS-JOINING-01` new idempotent JOINED retry; existing corrected history, forbid post-join withdraw | Concurrent corrections and role revocation |
| `offer-service.listOwnPlacementOffers` | Same: learner sees accepted and pending joining | Other learner/college isolation |
| `job-service.createPlacementJob`, `publishPlacementJob` | Same: publishes preconditioned season/company/round fixture | Separate job lifecycle transition matrix |
| `application-service.applyToPlacementJob` | Same: creates preconditioned learner application | Duplicate racing apply; reapply/stale role |
| `screening-service.decidePlacementScreening` | Same: shortlist precondition; revoked shortlist fails issuance | All invalid decisions |
| `round-service.createPlacementRound`, `actOnPlacementRound` | Same: create, schedule, complete final round | Multiple simultaneous state changes |
| `result-service.stagePlacementRoundResult`, `applyPlacementRoundResult` | Same: staging then separate application before issuing offer | Hold/waitlist/failed outcome matrix |
| TPO selections route `/tpo/placements/jobs/[jobId]/selections` | `tests/unit/chat5-placements-ux-workflows.test.ts`: `UX-tpo-placements-jobs-jobid-selections-02` role, published/storage guards and real manager/import | Runtime error boundary, focus/device tests |
| TPO waitlist route `/tpo/placements/jobs/[jobId]/waitlist` | Same: `UX-tpo-placements-jobs-jobid-waitlist-02` role, scoped read and preview-token guarded confirm | Race/rollback |
| TPO offers route `/tpo/placements/jobs/[jobId]/offers` | Same: `UX-tpo-placements-jobs-jobid-offers-02` validated filters and CSV parity | Tenant-leak CSV integration |
| TPO offer evidence route `/tpo/placements/jobs/[jobId]/offers/[offerId]` | Same: `UX-tpo-placements-jobs-jobid-offers-offerid-02` scoped lookup and non-inferred outcomes | Wrong job / offer IDOR integration |
| TPO joining route `/tpo/placements/jobs/[jobId]/joining` | Same: `UX-tpo-placements-jobs-jobid-joining-02` role, accepted-only persisted outcomes | Partial/error runtime state |
| TPO round result route `/tpo/placements/jobs/[jobId]/rounds/[roundId]/results` | Same: `UX-tpo-placements-jobs-jobid-rounds-roundid-results-02` validation before read, bulk cap and separate apply | 500+ roster integration / pagination |
| TPO selection modal `src/components/placements/tpo-drive-selection-manager.tsx` | Same: `UX-placements-scroll-motion-01`, `UX-placements-selection-targets-01`, `PLACEMENTS-SELECTION-ERROR-01` source asserts scroll cue, accessible controls, friendly error and preserved chosen | Browser focus trap, network simulation |

## Deliberately uncovered areas

The `src/modules/placements` folder has hundreds of exports and far more handlers than listed; this is not an exhaustive generated inventory. Outstanding high-risk service branches include `tpo-waitlist-promotion-service.offerToNextWaitlisted`, `tpo-drive-selection-service`, `offer-cascade-undo-service.undoPlacementOfferCascade`, the sweep scheduler and cancellation overlap, `college-retention-report-service`, cross-tenant/role denials, CSV injection, notifications and audit dedupe, and actual transaction rollback/retry. More integration tests with isolated PostgreSQL fixtures are essential before release sign-off.
