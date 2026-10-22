# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat4-college-academic-cross-tenant-pg.test.ts (1 failing)
- COL-academics-scope-tenant-PG-01 forged but FK-valid tenant relationships

  ```
  error: inconsistent types deduced for parameter $3
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/chat4-college-academic-cross-tenant-pg.test.ts:47:4
  45|    [ids.periodA,SEED_IDS.collegeA,"a"],[ids.periodB,SEED_IDS.collegeB,…
  46|   ]){
  47|    await pool.query(
  |    ^
  48|     "insert into academic_periods(id,college_id,name,code,start_date,e…
  ```

## tests/integration/company-applicant-share-capability-pg.test.ts (1 failing)
- Company applicant share PG capability acceptance > enforces expiry, revocation, tenant ownership and durable audited views

  ```
  error: null value in column "code_hash" of relation "placement_company_applicant_shares" violates not-null constraint
  ❯ node_modules/pg/lib/client.js:694:17
  ❯ tests/integration/company-applicant-share-capability-pg.test.ts:43:4
  41|     [job,SEED_IDS.collegeA,season,relationship,SEED_IDS.collegeAdminUs…
  42|    );
  43|    await client.query(
  |    ^
  44|     "insert into placement_company_applicant_shares(id,college_id,job_…
  ```

## tests/integration/hr-company-overview.test.ts (1 failing)
- HR company profile PG isolation > builds employer profile footprint without foreign-company or foreign-college rows

  ```
  PlacementsServiceError: PLACEMENT_JOB_NOT_PUBLISHABLE
  ❯ src/modules/placements/job-service.ts:830:13
  828|     ]);
  829|     if (!rounds.length || !policy.length) {
  830|       throw new PlacementsServiceError("PLACEMENT_JOB_NOT_PUBLISHABLE"…
  |             ^
  831|     }
  832|     const now = new Date();
  ```

## tests/integration/learner-application-withdrawal.test.ts (1 failing)
- Learner application withdrawal on fresh PostgreSQL fixtures > withdraws its own submitted application and atomically records reason + audit exactly once

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
