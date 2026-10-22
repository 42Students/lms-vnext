# CI unit-test packet (round 10db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/placements-p8-offers.test.ts (15 failing)
- Placement P8 offers and joining > PLACEMENTS-TPO-ESCALATE-21 DB escalates a future round only once, with a real college TPO recipient

  ```
  error: null value in column "learner_membership_id" of relation "placement_learner_requests" violates not-null constraint
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/placements-p8-offers.test.ts:517:17
  515|         timezone='Asia/Kolkata',mode='VIRTUAL',meeting_url='https://me…
  516|       where id=$1`,[round.id,new Date(reference.getTime()+6*3600_000)]…
  517|     const saved=await pool.query<{id:string}>(`
  |                 ^
  518|       insert into placement_learner_requests(
  ```
- Placement P8 offers and joining > TPO-JOIN-TRACKER-DB-35 projects only accepted offers and never interprets pending joining as JOINED

  ```
  Error: Failed query: select "placement_offers"."id", "placement_applications"."membership_id", "placement_jobs"."college_id" from "placement_offers" inner join "placement_applications" on "placement_applications"."id" = "placement_offers"."application_id" inner join "placement_jobs" on "placement_jo
  params: ACCEPTED,EXTERNAL_IMPORT,2026-10-22T11:42:54.063Z,OFFER_ACCEPTANCE_DISPUTE,PENDING,APPROVED,10
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Placement P8 offers and joining > PLACEMENTS-JOIN-SM-04 DB refuses future joining evidence without a partial history write

  ```
  Error: Failed query: select "placement_offers"."id", "placement_applications"."membership_id", "placement_jobs"."college_id" from "placement_offers" inner join "placement_applications" on "placement_applications"."id" = "placement_offers"."application_id" inner join "placement_jobs" on "placement_jo
  params: ACCEPTED,EXTERNAL_IMPORT,2026-10-22T11:42:54.284Z,OFFER_ACCEPTANCE_DISPUTE,PENDING,APPROVED,10
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-RACE-DB-04 rejects acceptance delayed past expiry by a competing offer row lock

  ```
  Error: Test timed out in 15000ms.
  If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
  ❯ tests/integration/placements-p8-offers.test.ts:969:3
  967|   });
  968|
  969|   it("PLACEMENTS-EXPIRY-RACE-DB-04 rejects acceptance delayed past exp…
  |   ^
  970|     const {application}=await preparePassedApplication();
  ```
- Placement P8 offers and joining > PLACEMENTS-CLOSE-PENDING-DB-06 direct close cannot strand a recorded but unreleased company selection

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-CAPACITY-PG-01 respects pending waitlist seats without double-counting its own reservation

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-ISSUE-ACTOR-DB-02 denies a suspended learner while retaining a legitimately shortlisted application

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-REVOKED-DB-01 refuses stale-credential TPO offer mutation after persisted role removal

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-CASCADE-17 DB recorded acceptance withdraws ineligible sibling application with correlated history

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-DUAL-ACCEPT-DB-01 rolls back a batch that accepts two official offers for one learner

  ```
  
  ```
- … 5 more in this file
