# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/hr-recruiter-shared-contact-policy.test.ts (1 failing)
- HR round contact disclosure isolation (isolated PG) > authorizes own round, masks foreign company, foreign college and wrong role before any candidates are read

  ```
  ReferenceError: publishPlacementJob is not defined
  ❯ tests/integration/hr-recruiter-shared-contact-policy.test.ts:30:3
  28|   // A published drive requires a persisted scoped eligibility policy.
  29|   await getDb().insert(placementJobEligibilityPolicies).values({jobId:…
  30|   await publishPlacementJob(tpo,job.id);
  |   ^
  31|   const userId=randomUUID();
  32|   const hr=(companyId:string,relationshipId:string,collegeId:string):R…
  ```

## tests/integration/super-admin-resources-directory.test.ts (1 failing)
- Super Admin resources directory disposable PostgreSQL > returns only resources, hides other kinds and foreign-college content

  ```
  Error: Failed query: select "admin_content_id", "admin_content_title", "notes", "points", "hasLegacyRichContent", "content_type", "admin_content_status", "sequence", "visible_to_students", "external_url", "duration_seconds", "starts_at", "ends_at", "admin_lesson_name", "admin_lesson_status", "admin_
  params: 20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000001,RESOURCE,0be19307-7b75-4fb3-a59a-acf68b5392e5,%admin-resource-85eef516%,%admin-resource-85eef516%,%admin-resource-85eef516%,%admin-resource-85eef516%,15
  ❯ NodePgPreparedQuery.queryWithCache node_modules/src/pg-core/session.ts:73:11
  ```
