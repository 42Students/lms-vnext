# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-activity-page-96.test.tsx (1 failing)
- HR-ACTIVITY-PAGE-96 recruiter history role and state coverage > bad duplicate filters and unsupported kinds fail with a retry link and no SQL

  ```
  AssertionError: expected '  Hiring activity   Invalid activity …' to contain 'Invalid activity filters.'
  Expected: "Invalid activity filters."
  Received: "  Hiring activity   Invalid activity filters Review the college and event filters. "
  ```

## tests/unit/HR-BREAK-chat15-round-slot-route-25.test.ts (1 failing)
- HR-ROUND-SLOT-ROUTE-25 recruiter mutation routes fail closed > stale and already-used round versions return 409, not silent success

  ```
  AssertionError: expected { Object (error, message) } to deeply equal { error: 'STALE_OR_USED_ROUND' }
  - Expected
  + Received
  {
  -   "error": "STALE_OR_USED_ROUND",
  +   "error": "PLACEMENT_ROUND_STALE",
  +   "message": "This round changed or has already been used for results or interviews. Refresh the rounds before trying again.",
  }
  ```

## tests/unit/HR-BREAK-chat19-drive-pages.test.ts (1 failing)
- HR-BREAK-chat19-drive-pages: job-specific actions never bypass scoped entry > renders only a currently editable authorized round, with its optimistic version

  ```
  AssertionError: expected [ { method: 'post', …(3) } ] to deep equally contain ObjectContaining{…}
  - Expected:
  ObjectContaining {
  "name": "action",
  "value": "REMOVE",
  }
  + Received:
  [
  ```

## tests/unit/HR-BREAK-today-service-01.test.ts (1 failing)
- HR-BREAK-today-service-01: college-scoped dashboard query branches > Today interview slots exclude already offered/booked rounds and preserve proposed rounds needing action

  ```
  AssertionError: expected [ [ 'offered', false ], …(2) ] to deeply equal [ [ 'proposal', true ], …(1) ]
  - Expected
  + Received
  @@ -1,9 +1,13 @@
  [
  [
  +     "offered",
  +     false,
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-meeting-body-routes.test.ts (4 failing)
- PROJ-BREAK-MENTOR-359..364 bounded meeting command HTTP contract > PROJ-BREAK-MENTOR-360 rejects declared payloads beyond 128 KiB without service calls

  ```
  AssertionError: new meeting: expected 201 to be 413 // Object.is equality
  - Expected
  + Received
  - 413
  + 201
  ```
- PROJ-BREAK-MENTOR-359..364 bounded meeting command HTTP contract > PROJ-BREAK-MENTOR-361 streams a 128 KiB + 1 byte body with the same bounded failure

  ```
  AssertionError: new meeting: expected 201 to be 413 // Object.is equality
  - Expected
  + Received
  - 413
  + 201
  ```
- PROJ-BREAK-MENTOR-359..364 bounded meeting command HTTP contract > PROJ-BREAK-MENTOR-362 rejects text/plain, invalid JSON and incorrect content lengths

  ```
  AssertionError: new meeting: expected 201 to be 415 // Object.is equality
  - Expected
  + Received
  - 415
  + 201
  ```
- PROJ-BREAK-MENTOR-359..364 bounded meeting command HTTP contract > PROJ-BREAK-MENTOR-363 forwards one decoded command and exact route identifiers

  ```
  AssertionError: expected Promise{…} to deeply equal { title: 'Mentor discussion', …(1) }
  - Expected
  + Received
  - {
  -   "expectedUpdatedAt": "2099-01-01T00:00:00.000Z",
  -   "title": "Mentor discussion",
  - }
  + Promise {}
  ```

## tests/unit/PROJ-BREAK-chat19-class-team-outcome-csv.test.ts (1 failing)
- PROJ-BREAK-OUTCOME-CSV-03: IIT Dharwad per-learner creation export > never adds a row when the authorized service returned no individual results

  ```
  AssertionError: expected '"Learner","Student membership","Resul…' to be '"Learner","Student membership","Resul…' // Object.is equality
  - Expected
  + Received
  - "Learner","Student membership","Result","Workspace","Project ID"
  + "Learner","Student membership","Result","Workspace","Project ID","Reason"
  ```
