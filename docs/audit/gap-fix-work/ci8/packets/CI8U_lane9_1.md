# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-submissions-tabs-resilience.test.tsx (1 failing)
- IIT Dharwad Projects: adversarial tab outage and pagination journeys > PROJ-BREAK-submissions-41 unsubmitted-only navigation never calls final-delivery services

  ```
  AssertionError: expected '/college/projects Submissions dashboa…' to contain 'q=IIT'
  Expected: "q=IIT"
  Received: "/college/projects Submissions dashboard Final project deliverables across all workspaces. Filters Not submitted ·  0  workspaces No matching workspace has an outstanding submission No matching workspaces on this page."
  ```

## tests/unit/api-origin-guard.test.ts (1 failing)
- state-changing API routes > every POST/PUT/PATCH/DELETE handler checks the request origin

  ```
  AssertionError: Handlers that change state without a same-origin check:
  src/app/api/internal/operations/notification-scheduler/route.ts POST
  src/app/api/internal/placements/tpo/deadline-today/route.ts POST
  src/app/api/internal/placements/tpo/interview-evening/route.ts POST
  src/app/api/internal/placements/tpo/offer-expiry/run/route.ts POST
  src/app/api/internal/storage/scan-verdict/route.ts POST
  src/app/api/lecture-halls/[hallId]/route.ts PUT
  src/app/api/notifications/[notificationId]/delete/route.ts DELETE
  ```
