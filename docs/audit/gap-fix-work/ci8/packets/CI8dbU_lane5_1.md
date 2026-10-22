# CI unit-test packet (round 8db)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/integration/courses-c4a-assignments.test.ts (3 failing)
- courses C4A assignments against PostgreSQL > enforces one-shot submission, rejects late or missing-deadline submissions, and checks assignment audience

  ```
  AssertionError: expected CoursesServiceError: ASSIGNMENT_METHOD_NO… { code: '…' } to match object { Object (code) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  - {
  -   "code": "ASSIGNMENT_ALREADY_SUBMITTED",
  + CoursesServiceError {
  +   "code": "ASSIGNMENT_METHOD_NOT_ALLOWED",
  ```
- courses C4A assignments against PostgreSQL > hides unpublished grades and rejects stale concurrent grading

  ```
  CoursesServiceError: ASSIGNMENT_METHOD_NOT_ALLOWED
  ❯ src/modules/courses/assignment-submission-service.ts:269:17
  267|             }));
  268|         if (!methodAllowed) {
  269|           throw new CoursesServiceError("ASSIGNMENT_METHOD_NOT_ALLOWED…
  |                 ^
  270|         }
  271|       }
  ```
- courses C4A assignments against PostgreSQL > enforces grade bounds and database payload constraints

  ```
  AssertionError: promise resolved "Result{ command: 'INSERT', …(9) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + Result {
  +   "RowCtor": null,
  +   "_parsers": undefined,
  ```
