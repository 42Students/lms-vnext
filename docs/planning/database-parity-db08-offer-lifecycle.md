# DB-029 — DB08 offer lifecycle persistence contract

**Worker:** Chat 5  
**Global phase:** DATABASE  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Staging SQL:** `scripts/sql/db08-offer-lifecycle-staging.sql`  
**Status:** SOURCE_REVIEWED / STAGED_NOT_REGISTERED / POSTGRES_NOT_RUN

DB-021 staged salary/bond terms, imported-acceptance metadata, cascade id,
revoke reason and release timestamp, but deliberately left the full offer state
machine unresolved. This follow-on closes that database representation gap.
It does not implement API/service transitions and does not claim runtime
verification.

## Source-active behavior

The pinned legacy runtime has live producers for persisted offer lifecycle state:

- `TpoOfferService.recordSelection` creates `SELECTED`.
- `verifyAndRelease` writes `RELEASED`, verifier, release time and response deadline.
- `respondInApp` writes `ACCEPTED` or `DECLINED`, response time and channel.
- `recordExternalAcceptance` writes `ACCEPTED + EXTERNAL_IMPORT` with a 48-hour dispute window.
- `reverseAcceptance` changes ACCEPTED back to `RELEASED`, clears responded time and restores the application to OFFERED.
- `withdrawOffer` writes `WITHDRAWN` and revoke reason.
- `setJoiningStatus` persists JOINED / DEFERRED / NOT_JOINED.
- scheduled `expireOverdue` changes overdue `RELEASED` offers to `EXPIRED`.

The registered vNext database currently persists only
`ISSUED / ACCEPTED / DECLINED / WITHDRAWN`, and status history requires a
human actor user. Selection-before-release, expiry, accepted-offer reversal
and system-authored expiry history therefore lack faithful persisted states.

## Canonical status decision

Do not create two names for the same released state.

| Legacy | Canonical vNext | Decision |
| --- | --- | --- |
| SELECTED | SELECTED | Add. Pre-release selection is active persisted state. |
| RELEASED | ISSUED | Reuse the existing vNext learner-visible state. |
| ACCEPTED | ACCEPTED | Keep. |
| DECLINED | DECLINED | Keep. |
| EXPIRED | EXPIRED | Add. Scheduled terminal no-response state. |
| WITHDRAWN | WITHDRAWN | Keep. |
| PENDING_VERIFICATION | UNVERIFIED DECLARED STATE | Entity comment contains it, but no current pinned TpoOfferService producer was found. |
| REVOKED | UNVERIFIED DECLARED STATE | Entity comment contains it; current source withdrawal producer writes WITHDRAWN. |

If a later source sweep finds an active PENDING_VERIFICATION or REVOKED writer,
add a follow-up rather than silently treating a model comment as runtime proof.

## Active JobOffer field disposition

| Legacy concept | Canonical target / disposition |
| --- | --- |
| id | `placement_offers.id` UUID redesign |
| application_id | `placement_offers.application_id` |
| kind | DB-021 `placement_offers.kind` |
| role_option_name | existing `role_title` |
| ctc_lpa | existing `annual_ctc_inr` after explicit LPA→annual-INR conversion |
| fixed/variable/joining bonus/bond | DB-021 staged package columns |
| joining_date | existing `joining_date` |
| respond_by | existing `expires_at` |
| letter_url | DB-016 private object receipt/reference; public URL intentionally retired |
| status | mapping above |
| acceptance_channel | DB-021 staged |
| accepted_disputable_until | DB-021 staged |
| joining_status | normalized `placement_joining_outcomes.status` + history; do not duplicate |
| cascade_id | DB-021 staged |
| revoke_reason | DB-021 staged |
| created_by_type | DB-029 `created_by_actor_type` snapshot |
| created_by_id | existing `issued_by_user_id` as canonical initial actor user id |
| verified_by | DB-029 `verified_by_user_id` plus `verified_at` |
| released_at | DB-021 staged |
| responded_at | existing `responded_at` |
| created_at | existing `issued_at` retained as record creation/initial issue clock; actual release uses `released_at` |
| updated_at | existing `updated_at` |
| version | existing positive version + application/version uniqueness |

The `issued_at` name becomes imperfect once SELECTED exists, but it still
preserves creation time and `released_at` removes ambiguity for release and
response-window calculations.

## Active uniqueness

The current partial unique index considers only ISSUED/ACCEPTED active. A
SELECTED row is also an active offer candidate. DB-029 stages one active row per
application across SELECTED / ISSUED / ACCEPTED.

This is a stronger vNext invariant than weak legacy physical enforcement and is
intentional: it prevents two concurrent active selections for the same
application while preserving versioned terminal history.

## Approved status-history transitions

The staged history relation allows only:

- initial → SELECTED;
- initial → ISSUED (temporary compatibility with the current direct vNext issue flow);
- SELECTED → ISSUED;
- SELECTED → ACCEPTED for the external-import path;
- SELECTED → WITHDRAWN;
- ISSUED → ACCEPTED / DECLINED / EXPIRED / WITHDRAWN;
- ACCEPTED → ISSUED for bounded reversal;
- ACCEPTED → WITHDRAWN.

ACCEPTED → ISSUED requires a nonblank reason so the reversal does not erase why
the previously accepted state was undone.

## Human versus system history actor

Legacy expiry is scheduler-authored. The current vNext history row requires
`actor_user_id NOT NULL`, which would force a fake user.

DB-029 stages:

- nullable `actor_user_id`;
- `actor_type = USER | SYSTEM`;
- USER requires a real actor id;
- SYSTEM requires actor id null;
- SYSTEM history is restricted to the expiry transition plus initial ISSUED
  compatibility for a future importer.

Never manufacture a user account for a scheduled transition.

## External acceptance is different from in-app acceptance

Legacy external import may set ACCEPTED without first following the in-app
release path. Consequently DB-029 does not universally require `released_at`
for ACCEPTED.

Canonical rule:

- IN_APP acceptance requires released/ISSUED state and release timestamp;
- EXTERNAL_IMPORT acceptance may exist without release timestamp, subject to
  DB-021 channel + dispute-window constraints.

The API phase must enforce this transactionally.

## Accepted-offer reversal

The source-active reversal:

1. starts from ACCEPTED;
2. is allowed for 48 hours in the legacy service;
3. restores application HIRED → OFFERED;
4. maps offer ACCEPTED → canonical ISSUED;
5. clears current response actor/time;
6. restores applications affected by the accept cascade;
7. carries a human reason.

DB-029 can represent the current offer/history state and requires a reversal
reason. Database DDL alone cannot prove the 48-hour clock or multi-row cascade;
those need service + PostgreSQL concurrency tests.

## Normalized concepts that remain separate

Do not duplicate fields merely to mirror legacy physical shape:

- joining status stays in `placement_joining_outcomes` and joining history;
- offer letter stays in DB-016 private object/receipt persistence;
- application OFFERED/HIRED/REJECTED remains application state/history;
- compensation/bond terms remain DB-021;
- PENDING_VERIFICATION and REVOKED remain unverified until current producers are proven.

## Acceptance witnesses — ALL NOT_RUN

- **DB29-01:** SELECTED persists before learner-visible release.
- **DB29-02:** concurrent active selection/issue cannot create two SELECTED/ISSUED/ACCEPTED rows for one application.
- **DB29-03:** SELECTED → ISSUED records verifier pair, release timestamp and immutable history.
- **DB29-04:** IN_APP acceptance requires a released offer.
- **DB29-05:** EXTERNAL_IMPORT acceptance can exist without prior release only under DB-021 channel/dispute rules.
- **DB29-06:** ACCEPTED → ISSUED reversal requires reason, clears current response fields and preserves prior history.
- **DB29-07:** reversal plus application/cascade restoration is atomic under injected failure.
- **DB29-08:** overdue ISSUED expires exactly once and history actor is SYSTEM with null user id.
- **DB29-09:** expiry racing learner ACCEPT cannot produce two terminal outcomes.
- **DB29-10:** withdrawal from SELECTED/ISSUED/ACCEPTED preserves actor/time and prior history.
- **DB29-11:** joining state remains normalized; no offer-level duplicate joining_status is introduced.
- **DB29-12:** private offer letter remains authorized private object persistence, never public letter_url.
- **DB29-13:** wrong-college application/offer/actor references fail tenant/parent guards.
- **DB29-14:** numbered migration replay + snapshot drift pass after Chat 1 integration.
- **DB29-15:** exhaustive source/consumer sweep proves PENDING_VERIFICATION and REVOKED are inactive or creates a follow-up.

## Integration order

1. registered base placement schema;
2. DB08 batch/eligibility structures;
3. DB-021 outcome-fidelity additions;
4. **DB-029 lifecycle expansion**;
5. API/service writer cutover;
6. PostgreSQL negative/race acceptance.

Chat 1 exclusively owns numbered Drizzle migrations and the shared schema
barrel. This file and the paired SQL are staging evidence only.

## Completion boundary

DB-029 may be **COMPLETED, unverified** after SQL, source contract and static
shape tests are committed. It is not DONE_VERIFIED until registered PostgreSQL
replay and applicable DB29 witnesses pass on the integrated source SHA.
