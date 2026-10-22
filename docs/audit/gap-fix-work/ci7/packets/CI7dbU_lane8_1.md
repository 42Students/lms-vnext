# CI unit-test packet (round 7db)

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

## tests/integration/placements-p8-offers.test.ts (30 failing)
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-NOTIFY-30 DB records and notifies exactly once after offer deadline, never from a GET

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-RACE-05 DB serializes sweep versus same-offer learner acceptance into one terminal outcome

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-EXPIRY-SM-04 DB entrypoint rejects an invalid sweep clock or unsafe batch limit before any writes

  ```
  
  ```
- Placement P8 offers and joining > TPO-2ND-PAGE-OFFERS-DB-01 protects live register and export against a foreign-college actor

  ```
  
  ```
- Placement P8 offers and joining > TPO-2ND-PAGE-OFFER-EVIDENCE-DB-02 rejects a real offer ID paired with a different drive

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-IDOR-01 refuses a wrong-college TPO, learner issuing an offer and TPO self-acceptance

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-ESCALATE-21 DB escalates a future round only once, with a real college TPO recipient

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-NOTICE-19 DB preference opt-out suppresses TPO notice without dropping audited decision

  ```
  
  ```
- Placement P8 offers and joining > PLACEMENTS-TPO-NOTICE-18 DB issues exactly one preference-scoped learner notice per durable TPO decision

  ```
  
  ```
- Placement P8 offers and joining > TPO-JOIN-TRACKER-DB-35 projects only accepted offers and never interprets pending joining as JOINED

  ```
  
  ```
- … 20 more in this file
