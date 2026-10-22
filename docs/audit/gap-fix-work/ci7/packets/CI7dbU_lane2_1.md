# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/chat4-college-academic-cross-tenant-pg.test.ts (1 failing)
- COL-academics-scope-tenant-PG-01 forged but FK-valid tenant relationships

  ```
  error: Section cohort and academic period must belong to one college
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ tests/integration/chat4-college-academic-cross-tenant-pg.test.ts:73:4
  71|    [ids.wrongPeriodSection,ids.cohortA,ids.periodB,"invalid"],
  72|   ]){
  73|    await pool.query(
  |    ^
  74|     "insert into sections(id,cohort_id,academic_period_id,name,code,st…
  ```

## tests/integration/mentor-resource-directory.test.ts (3 failing)
- Mentor scoped resource metadata and links — PostgreSQL > denies Learner/foreign Resource edits without persisting audit or changing content

  ```
  
  ```
- Mentor scoped resource metadata and links — PostgreSQL > writes all three Resource event types atomically and exposes only redacted Mentor labels

  ```
  
  ```
- Mentor scoped resource metadata and links — PostgreSQL > reads only assigned project resource metadata and denies forged/foreign scope

  ```
  error: update or delete on table "project_instances" violates foreign key constraint "project_resource_audit_project_id_fkey" on table "project_resource_audit"
  ❯ node_modules/pg-pool/index.js:45:11
  ❯ cleanup tests/integration/mentor-resource-directory.test.ts:42:5
  40|       await pool.query("delete from "+table+" where project_id=any($1:…
  41|     }
  42|     await pool.query("delete from project_instances where id=any($1::u…
  |     ^
  43|   }
  ```
