# CI unit-test packet (round 5db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/academics-core.test.ts (1 failing)
- academics A1 against PostgreSQL > builds the Program -> Period -> Cohort -> Section hierarchy

  ```
  AssertionError: promise rejected "AcademicsServiceError: PROGRAM_HAS_COHORTS { code: '…' }" instead of resolving
  ❯ tests/integration/academics-core.test.ts:325:6
  323|         program.id,
  324|       ),
  325|     ).resolves.toMatchObject({
  |      ^
  326|       status: "ARCHIVED",
  327|     });
  ```

## tests/integration/college-faculty-detail-scope.test.ts (1 failing)
- College Faculty Detail DB ownership > denies non-admin and forged college context

  ```
  AssertionError: promise resolved "{ person: { …(6) }, …(5) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "assignments": [
  +     {
  ```

## tests/integration/db10-notification-guards.test.ts (4 failing)
- DB10 notification correctness and privacy > reports actual inserted deliveries, not eligible attempts on duplicate

  ```
  AssertionError: expected 13 to be 1 // Object.is equality
  - Expected
  + Received
  - 1
  + 13
  ```
- DB10 notification correctness and privacy > counts all 105 unread rows, respects owner and updates after read

  ```
  AssertionError: expected 117 to be 105 // Object.is equality
  - Expected
  + Received
  - 105
  + 117
  ```
- DB10 notification correctness and privacy > rejects protocol-relative, backslash and control-character links

  ```
  AssertionError: expected 12 to be +0 // Object.is equality
  - Expected
  + Received
  - 0
  + 12
  ```
- DB10 notification correctness and privacy > returns committed read state when multiple requests acknowledge concurrently

  ```
  AssertionError: expected 12 to be +0 // Object.is equality
  - Expected
  + Received
  - 0
  + 12
  ```

## tests/integration/hr-notifications.test.ts (1 failing)
- HR in-app notification scopes > reads only own recipient's exact company job notification

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
