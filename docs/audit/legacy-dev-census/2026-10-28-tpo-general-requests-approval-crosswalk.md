# TPO general requests — seven-kind crosswalk and absence approval repair (2026-10-28)

**Evidence/repair note, not Implementation Green and not another tracker.**
Legacy FE pinned at `9d56bb7a347b06f242ef615c19fdc298f83329e0` and backend at `ecb09416b107e82e5ac7d22f3bc94a85258754b3`. Compare against current vNext `main` at the parent commit `6001af461517890327488b2fadd3696167db016d`.

## Verified source crosswalk

Legacy `src/components/tpo/RequestsPanel.js:L24-L26` exposes seven request kinds. They are **not all missing** from vNext: `src/modules/placements/tpo-general-request-model.ts` records the explicit split, `src/components/placements/learner-general-requests.tsx` provides general submission, and the global `/tpo/requests` page composes `TpoGeneralRequestsPanel` with its specialized inbox.

| Legacy kind | vNext kind | Queue | Decision effect status from current source |
| --- | --- | --- | --- |
| WITHDRAWAL | APPLICATION_WITHDRAWAL | Specialized placement learner requests | Specialized decision workflow exists; end-to-end acceptance still required |
| OFFER_EXTENSION | OFFER_EXTENSION | Specialized placement learner requests | Specialized decision workflow exists; end-to-end acceptance still required |
| REGISTRATION_CHANGE | REGISTRATION_CHANGE | General | Transactional registration update implemented |
| ABSENCE_DISPUTE | ABSENCE_DISPUTE | General | Transactional attendance correction exists; **UI approval was blocked and has now been enabled** |
| CORRECTION | CORRECTION_WITH_PROOF | General | Submission and rejection exist; automatic approval remains unsupported and is deliberately disabled |
| EXTERNAL_OFFER | OFF_CAMPUS_OFFER | General | Transactional verified external-offer creation implemented |
| PAP | PLACEMENT_AFTER_PLACEMENT | General | Submission and rejection exist; automatic approval remains unsupported and is deliberately disabled |

The general model also supports an additional `OFFER_ACCEPTANCE_DISPUTE`, which should not be counted as one of those seven legacy kinds.

## Confirmed before → after

**Before:** `tpo-general-request-service.ts` `approveEffect` already contains an `ABSENCE_DISPUTE` branch. It checks the original learner membership, application, job, round and college; requires a locked `ABSENT` attendance record; applies `PRESENT`; writes an activity audit in the same decision transaction; and sends the student a decision notification. However, the TPO review panel defined `approveSupported` using only `OFF_CAMPUS_OFFER` and `REGISTRATION_CHANGE`. Therefore the dialog offered no approving action for an absence dispute.

**After:** `tpoGeneralRequestCanApprove` provides one explicit client-safe policy for the three source-backed supported effects. The review dialog now exposes `Approve and apply` for `ABSENCE_DISPUTE` while still denying unimplemented correction, PAP and offer-acceptance-dispute approvals. No database migration, authorization rule, or backend decision behavior was altered.

**Regression coverage authored:** `tests/unit/tpo-general-request-approval-parity.test.ts` checks the legacy seven-kind crosswalk, approved/unsupported sets, UI binding and persisted attendance effect guard. Existing `chat12-general-request-absence-effect.test.ts` separately asserts the decision-time ownership/attendance audit contract.

## Acceptance not claimed

- This commit does **not** execute Vitest, TypeScript typecheck, a real PostgreSQL decision, or browser E2E acceptance; those remain explicit unverified gates until run on the target SHA.
- Confirm a real TPO can approve an authentic in-college ABSENT round attendance dispute; the student is notified, the persisted mark changes, and a replay/stale/cross-tenant request is rejected. Confirm missing/changed absence records fail without marking the request APPROVED.
- Specialist handling or approved parity exceptions are still required for correction, PAP and any other unsupported positive decision.
- Role and tenant authorization, feature enablement, private proof access and actual UI/prototype acceptance still require their own gates.
- `docs/tracker.json` and existing page-family Green state must not change solely from this source repair.

## Timely external acceptance dispute — transaction added, runtime acceptance pending

The legacy TPO offer service records employer-reported acceptance without the
placement cascade and lets the learner dispute it within 48 hours. The vNext
maturity worker already excludes an in-window PENDING/APPROVED dispute but
the TPO decision service formerly rejected every positive
`OFFER_ACCEPTANCE_DISPUTE` decision as `EFFECT_UNSUPPORTED`.

An approved, authenticated TPO decision now validates the active learner
membership and college, locks membership before the owned offer, confirms that
the external acceptance is still provisional (`cascadeId` is null), confirms
the learner filed the request before the recorded cutoff (not necessarily
that review completed before cutoff), locks and checks PENDING joining state,
and restores the offer to `ISSUED` with a fresh at-least-48-hour response
deadline. It clears imported acceptance fields, increments `rowVersion`,
writes `ACCEPTED -> ISSUED` offer history, and persists the request decision,
audit and learner notice in the same transaction. Any changed/foreign/finalized
offer fails closed with no partial approval. The bulk model deliberately
refuses this action; only individual review can approve it.

The existing `ISSUED` enum in vNext corresponds to the old offer's
`RELEASED` state. No cascade reversal is attempted: this effect is allowed
only before the cascade is ever persisted.

This is **CODE COMPLETE / UNVERIFIED**, not Green. Run fresh CI, a real
seeded PostgreSQL positive and stale/other-college/concurrent-maturity
negative path, browser decision and learner notice/offer refresh, and
compare the legacy post-reversal response window. Correction-with-proof and
PAP approvals remain deliberately unsupported.

## PostgreSQL integration acceptance authored

`tests/integration/placements-p8-offers.test.ts` now includes a disposable
positive approval starting with a genuine seeded issued offer, TPO-reported
external acceptance and the learner's own persisted in-window dispute,
then verifies the approved transaction, reset offer fields, renewed response
deadline, incremented row revision, transition history, learner notice,
replayed-decision rejection and non-maturation. It also tests that a
conflicting finalized cascade fails closed without approving the request.
The existing P8 fixture cleanup removes general-request rows/events before
offer rows. These tests are **authored, not yet presumed passed**, pending
the corresponding CI PostgreSQL run. Browser acceptance remains separate.
