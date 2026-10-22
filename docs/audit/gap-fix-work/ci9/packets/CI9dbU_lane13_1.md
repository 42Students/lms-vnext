# CI unit-test packet (round 9db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/placements-p8-offers.test.ts (20 failing)
- Placement P8 offers and joining > TPO-2ND-PAGE-OFFERS-DB-01 protects live register and export against a foreign-college actor

  ```
  Error: .omit() cannot be used on object schemas containing refinements
  ❯ Module.omit node_modules/zod/v4/core/util.js:442:15
  ❯ _.omit node_modules/zod/v4/classic/schemas.js:888:21
  ```
- Placement P8 offers and joining > PLACEMENTS-IDOR-01 refuses a wrong-college TPO, learner issuing an offer and TPO self-acceptance

  ```
  AssertionError: expected PlacementsServiceError: PLACEMENT_OFFER_N… { code: '…' } to be an instance of AuthorizationError
  ❯ tests/integration/placements-p8-offers.test.ts:481:6
  479|     await expect(
  480|       actOnPlacementOffer(tpo, issued.id, {action: "ACCEPT"}),
  481|     ).rejects.toBeInstanceOf(AuthorizationError);
  |      ^
  482|     await expect(
  483|       recordPlacementJoiningOutcome(learner, issued.id, {
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-ESCALATE-21 DB escalates a future round only once, with a real college TPO recipient

  ```
  error: new row for relation "placement_job_rounds" violates check constraint "placement_job_rounds_lifecycle_ck"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/placements-p8-offers.test.ts:500:5
  498|     const {job,application,round}=await preparePassedApplication();
  499|     const reference=new Date("2099-10-24T00:00:00.000Z");
  500|     await pool.query(`
  |     ^
  501|       update placement_job_rounds set status='SCHEDULED',scheduled_at=…
  ```
- Placement P8 offers and joining > TPO-JOIN-TRACKER-DB-35 projects only accepted offers and never interprets pending joining as JOINED

  ```
  PlacementsServiceError: PLACEMENT_JOINING_NOT_READY
  ❯ src/modules/placements/tpo-offer-lifecycle-service.ts:141:15
  139|           (!offer.cascadeId || (offer.acceptedDisputableUntil &&
  140|             offer.acceptedDisputableUntil > now))) {
  141|         throw new PlacementsServiceError("PLACEMENT_JOINING_NOT_READY"…
  |               ^
  142|       }
  143|       if(input.action==="RECORD_ACCEPTED"){
  ```
- Placement P8 offers and joining > PLACEMENTS-JOIN-SM-04 DB refuses future joining evidence without a partial history write

  ```
  PlacementsServiceError: PLACEMENT_JOINING_NOT_READY
  ❯ src/modules/placements/tpo-offer-lifecycle-service.ts:141:15
  139|           (!offer.cascadeId || (offer.acceptedDisputableUntil &&
  140|             offer.acceptedDisputableUntil > now))) {
  141|         throw new PlacementsServiceError("PLACEMENT_JOINING_NOT_READY"…
  |               ^
  142|       }
  143|       if(input.action==="RECORD_ACCEPTED"){
  ```
- Placement P8 offers and joining > PLACEMENTS-SELECTION-IDEMP-DB-01 retries an identical selection without a second audit or timestamp change

  ```
  AssertionError: expected PlacementsServiceError: PLACEMENT_JOB_NOT… { code: '…' } to be an instance of AuthorizationError
  ❯ tests/integration/placements-p8-offers.test.ts:720:70
  718|     const foreignTpo:RequestContext={...tpo,membership:{...tpo.members…
  719|       id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.college…
  720|     await expect(recordTpoDriveSelections(foreignTpo,job.id,request)).…
  |                                                                      ^
  721|     await expect(recordTpoDriveSelections(learner,job.id,request)).rej…
  722|     const stillOne=await pool.query<{count:number}>(
  ```
- Placement P8 offers and joining > PLACEMENTS-WAIT-RACE-06 DB never releases two offers for concurrent identical waitlist previews

  ```
  error: new row for relation "placement_round_results" violates check constraint "placement_round_results_candidate_message_ck"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/placements-p8-offers.test.ts:752:5
  750|   it("PLACEMENTS-WAIT-RACE-06 DB never releases two offers for concurr…
  751|     const {job,application,round}=await preparePassedApplication();
  752|     await pool.query(
  |     ^
  753|       "update placement_round_results set outcome='HOLD',waitlist_rank…
  ```
- Placement P8 offers and joining > PLACEMENTS-WAIT-SEASON-05 DB denies waitlist promotion and seat creation after season closure

  ```
  error: new row for relation "placement_round_results" violates check constraint "placement_round_results_candidate_message_ck"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/placements-p8-offers.test.ts:799:5
  797|   it("PLACEMENTS-WAIT-SEASON-05 DB denies waitlist promotion and seat …
  798|     const {job,application,round}=await preparePassedApplication();
  799|     await pool.query(
  |     ^
  800|       "update placement_round_results set outcome='HOLD',waitlist_rank…
  ```
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-RACE-DB-04 rejects acceptance delayed past expiry by a competing offer row lock

  ```
  Error: Test timed out in 5000ms.
  If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
  ❯ tests/integration/placements-p8-offers.test.ts:947:3
  945|   });
  946|
  947|   it("PLACEMENTS-EXPIRY-RACE-DB-04 rejects acceptance delayed past exp…
  |   ^
  948|     const {application}=await preparePassedApplication();
  ```
- Placement P8 offers and joining > PLACEMENTS-CLOSE-PENDING-DB-06 direct close cannot strand a recorded but unreleased company selection

  ```
  
  ```
- … 10 more in this file
