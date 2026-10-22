# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/learner-support-history-pagination.test.ts (2 failing)
- own authorized support request filtering and pagination > returns persisted own request under its real type/status

  ```
  
  ```
- own authorized support request filtering and pagination > denies forged college, suspended and wrong-role

  ```
  error: null value in column "learner_membership_id" of relation "placement_learner_requests" violates not-null constraint
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/learner-support-history-pagination.test.ts:17:3
  15|   fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCal…
  16|   id=randomUUID();
  17|   await pool.query(
  |   ^
  18|     "INSERT INTO placement_learner_requests(id,application_id,request_…
  ```

## tests/integration/placements-p6a-screening.test.ts (5 failing)
- Placement P6A screening > creates a pending screening queue item and exposes only learner-safe state

  ```
  ZodError: [
  {
  "code": "unrecognized_keys",
  "keys": [
  "metadata"
  ],
  "path": [],
  "message": "Unrecognized key: \"metadata\""
  ```
- Placement P6A screening > audits hold-to-shortlist transitions without leaking internal notes

  ```
  
  ```
- Placement P6A screening > keeps rejection internals private while exposing candidate-safe wording

  ```
  
  ```
- Placement P6A screening > removes withdrawn applications from the active queue and blocks later decisions

  ```
  
  ```
- Placement P6A screening > rejects a screening manager from another college

  ```
  error: update or delete on table "placement_jobs" violates foreign key constraint "placement_job_rounds_job_id_placement_jobs_id_fk" on table "placement_job_rounds"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/placements-p6a-screening.test.ts:118:3
  116|     "delete from placement_candidate_academic_evidence",
  117|   );
  118|   await pool.query("delete from placement_jobs");
  |   ^
  119|   await pool.query(
  ```

## tests/integration/projects-placements-pg-harness-placements.test.ts (1 failing)
- PROJ-HARNESS-PLACEMENTS canonical real PostgreSQL fixtures > PROJ-HARNESS-RECRUITER-22 company-bound verified recruiter grant is not a college membership

  ```
  error: syntax error at or near "grant"
  ❯ node_modules/pg/lib/client.js:694:17
  ❯ Object.query tests/integration/support/projects-placements-pg-harness.ts:139:17
  137|       client, runId: randomUUID(),
  138|       async query<T extends QueryResultRow>(sql: string, values?: unkn…
  139|         return (await client.query<T>(sql, values)).rows;
  |                 ^
  140|       },
  ```
