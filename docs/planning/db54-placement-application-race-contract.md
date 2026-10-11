# DB-054 — placement application access/eligibility race contract

**Phase:** DATABASE  
**Source defect:** DB-015 P5-R01  
**Regression:** `tests/integration/db18-placement-race-gap.test.ts`  
**State:** fix authored on `main`; PostgreSQL runtime execution pending.

## Defect

Before DB-054, learner self-apply performed both:
- paid/inherited Placements access (`requireLearnerPlacementAccess`), and
- job-specific eligibility (`evaluatePlacementEligibility`)

before opening the application write transaction.

The transaction re-locked the job and role option, but persisted the earlier eligibility snapshot. A concurrent access/eligibility writer could therefore make the learner ineligible after the optimistic check and before the insert.

## Ordering contract

Application ordering is now:

1. fail-fast source checks outside the transaction;
2. transaction locks `placement_jobs` FOR UPDATE;
3. transaction freezes the learner membership/role and current academic chain;
4. transaction locks existing Placements module rules, inherited participation decisions, active job override, job policy and academic evidence FOR SHARE;
5. live `evaluatePlacementEligibility` runs after those ordering locks;
6. only the live result may be persisted into `placement_applications.eligibility_status/eligibility_snapshot`;
7. role option is re-locked and normal application insert/history/screening/activity remain in the same transaction.

The pre-transaction result is now only a fail-fast optimization and is never the committed eligibility snapshot.

## Writer-side lock compatibility

DB-054 also orders legitimate eligibility writers with the application:

- job eligibility policy upsert: lock `placement_jobs` FOR UPDATE and re-check DRAFT before writing;
- eligibility override create/revoke: lock `placement_jobs` FOR UPDATE before mutation;
- learner/verified academic evidence upsert: lock `college_memberships` FOR UPDATE before mutation.

The application uses the same order: **job first, then membership/access inputs**. This avoids a job↔membership lock inversion between application and job-specific eligibility writers.

An eligibility mutation which starts first commits before the application recheck and is observed. A mutation which starts later waits for the application transaction, giving a deterministic serial order rather than a stale snapshot.

## Deterministic regression

The P5-R01 integration witness:

1. creates an isolated college/learner/academic/placement fixture;
2. enables Placements at college scope and marks cohort participation ELIGIBLE;
3. publishes an internal job;
4. holds the module-rule and learner-membership rows;
5. starts learner self-apply;
6. disables the paid Placements rule while the submission is ordered behind those locks;
7. releases the writer;
8. requires the application operation to reject;
9. requires zero persisted `placement_applications`.

No shared seed access state is mutated.

## Source/static acceptance

`tests/db54-placement-application-race.test.mjs` pins:
- gate locks before live eligibility;
- committed snapshot uses `liveEligibility`;
- current restrictive input tables are represented in the ordering helper;
- job policy/override writers use the job lock;
- academic-evidence writers use the membership lock;
- deterministic P5-R01 witness still requires rejection and zero persistence.

These source assertions are authored, not runtime proof.

## Residual database-phase limits

- P5-R01 stays **runtime pending** until disposable PostgreSQL executes the race witness.
- Existing-row updates are explicitly ordered by row locks. A future new writer for module-access or inherited participation must use an ordering mechanism compatible with this contract; direct uncoordinated SQL insertion of a brand-new more-specific rule is not claimed safe merely by this service fix.
- DB-054 does not register migrations or change API/UI behavior.
- P5-R02 academics remains independently red and is not closed by DB-054.
