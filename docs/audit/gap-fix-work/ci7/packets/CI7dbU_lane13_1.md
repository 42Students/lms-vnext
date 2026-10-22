# CI unit-test packet (round 7db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/hr-drive-list.test.ts (1 failing)
- HR drive list scope (isolated PG) > publishes only a ready job and denies recruiter ownership of a TPO-authored drive

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/integration/projects-p7a-resources-readiness.test.ts (2 failing)
- Projects P7A resources and readiness > keeps template provenance separate from mentor-added resources

  ```
  ProjectsServiceError: PROJECT_RESOURCE_STALE_VERSION
  ❯ archiveProjectResource src/modules/projects/resource-service.ts:406:11
  404|   const input=archiveProjectResourceInputSchema.parse(rawInput);
  405|   if (scope.access==="MENTOR" && !input.expectedUpdatedAt)
  406|     throw new ProjectsServiceError("PROJECT_RESOURCE_STALE_VERSION");
  |           ^
  407|   const resourceId =
  408|     projectResourceIdSchema.parse(resourceIdInput);
  ```
- Projects P7A resources and readiness > enforces the no-empty-resource rule on create and update

  ```
  AssertionError: expected ProjectsServiceError: PROJECT_RESOURCE_ST… { code: '…' } to match object { name: 'ZodError' }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "name": "ZodError",
  + ProjectsServiceError {
  +   "name": "ProjectsServiceError",
  ```
