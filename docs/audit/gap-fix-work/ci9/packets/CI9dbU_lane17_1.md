# CI unit-test packet (round 9db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/storage-files-courses-db.test.ts (3 failing)
- assignment submission files against PostgreSQL > runs upload, verification, submit, grants and audit end to end

  ```
  CoursesServiceError: ASSIGNMENT_METHOD_NOT_ALLOWED
  ❯ src/modules/courses/assignment-submission-file-service.ts:490:18
  488|           links:input.links,
  489|           fileMimeTypes:files.map(file=>file.verifiedContentType??file…
  490|         }))throw new CoursesServiceError("ASSIGNMENT_METHOD_NOT_ALLOWE…
  |                  ^
  491|       }
  492|       const byId = new Map(files.map((file) => [file.id, file]));
  ```
- database guarantees for submission files > rejects a FILE submission without a READY file at commit and cross-college owner pairs

  ```
  error: Learner is not actively enrolled in assessment section
  ❯ node_modules/pg/lib/client.js:694:17
  ❯ tests/integration/storage-files-courses-db.test.ts:456:7
  454|     try {
  455|       await client.query("begin");
  456|       await client.query(
  |       ^
  457|         `insert into assignment_submissions (assignment_id, delivery_i…
  ```
- lesson videos against PostgreSQL > follows the linked lesson content visibility and returns the saved resume position

  ```
  AssertionError: expected +0 to be 125 // Object.is equality
  - Expected
  + Received
  - 125
  + 0
  ```
