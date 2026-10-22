# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/COURSES-BREAK-ROUTES-01.test.ts (2 failing)
- COURSES-BREAK-ROUTES-01 real Learner/Faculty course mutation route boundaries > uses authenticated request context for Faculty assignment grade and returns only persisted service result

  ```
  AssertionError: expected 409 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 409
  ```
- COURSES-BREAK-ROUTES-01 real Learner/Faculty course mutation route boundaries > uses authenticated request context for Learner quiz final submission and returns only persisted service result

  ```
  AssertionError: expected 200 to be 201 // Object.is equality
  - Expected
  + Received
  - 201
  + 200
  ```

## tests/unit/HR-BREAK-chat15-recruiter-change-requests-page-68.test.tsx (2 failing)
- HR-RECRUITER-PAGE-68: scoped drive change-request page > unregistered storage is presented as a truthful unavailable state, not silent success

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```
- HR-RECRUITER-PAGE-68: scoped drive change-request page > authorized employer gets a populated component without changing party or acting identity

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```

## tests/unit/HR-BREAK-chat19-decision-read.test.ts (1 failing)
- HR-BREAK-DECISION-READ-46 verified recruiter decision receipt > prevents rapid double clicks, redirects and short phone targets

  ```
  AssertionError: expected '"use client";\nimport { InlineNotice …' to contain 'focus-visible:outline-2'
  - Expected
  + Received
  - focus-visible:outline-2
  + "use client";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Button } from "@/components/ui/button";
  + import {useRef,useState} from "react";
  ```

## tests/unit/HR-BREAK-request-drive-page-01.test.ts (5 failing)
- HR-BREAK-request-drive-page-01: no-grant, wrong college and stale draft > invalid college/query combinations and guessed college IDs are rejected before a DB read

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <DriveSourceUnavailable />
  ```
- HR-BREAK-request-drive-page-01: no-grant, wrong college and stale draft > zero grants shows explicit no-active-college recovery, not arbitrary default college

  ```
  AssertionError: expected '  Request a drive Choose an authorize…' to contain 'No active college access'
  Expected: "No active college access"
  Received: "  Request a drive Choose an authorized college before drafting a hiring request.  Choose a college  Select an authorized college before requesting a drive. No college selected Ask the placement cell to grant recruiter access before preparing a drive. "
  ```
- HR-BREAK-request-drive-page-01: no-grant, wrong college and stale draft > multiple grants require explicit college; chooser has only authorized college links

  ```
  AssertionError: expected [] to include '/hr/drives/new?collegeId=123e4567-e89…'
  ❯ tests/unit/HR-BREAK-request-drive-page-01.test.ts:73:25
  71|   const result=await page();
  72|   expect(rendered(result)).toContain("Choose an authorized college");
  73|   expect(hrefs(result)).toContain("/hr/drives/new?collegeId="+collegeA…
  |                         ^
  74|   expect(hrefs(result)).toContain("/hr/drives/new?collegeId="+collegeB…
  75|   expect(m.branches).not.toHaveBeenCalled();
  ```
- HR-BREAK-request-drive-page-01: no-grant, wrong college and stale draft > a stale or cancelled request cannot be treated as a valid edit or sent-back revision

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <DriveSourceUnavailable
  +   collegeId="123e4567-e89b-42d3-a456-426614174001"
  ```
- HR-BREAK-request-drive-page-01: no-grant, wrong college and stale draft > a valid new request remains scoped to its college and uses authorized branch suggestions

  ```
  AssertionError: expected '  Request a drive Authorized Company …' to contain 'Your request will be saved for placem…'
  Expected: "Your request will be saved for placement-cell review."
  Received: "  Request a drive Authorized Company · College A      Draft · not yet sent   Request is scoped to  College A . Dates and publication stay with the placement cell.       More drive destinations     View previously sent discussion proposals   Record an outside-platform drive   College enrol
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-closeout-revocation.test.ts (1 failing)
- Mentor closeout authorization and checklist > PROJ-BREAK-MENTOR-236 rescinded project grant prevents closeout facts or completion

  ```
  AssertionError: expected [Function] to throw error including 'PROJECT_LIFECYCLE_ACCESS_DENIED' but got '[vitest] No "isNull" export is define…'
  - Expected
  + Received
  - PROJECT_LIFECYCLE_ACCESS_DENIED
  + [vitest] No "isNull" export is defined on the "drizzle-orm" mock. Did you forget to return it from "vi.mock"?
  + If you need to partially mock a module, you can use "importOriginal" helper inside:
  +
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-uncovered-models.test.ts (1 failing)
- PROJ-BREAK-MENTOR-148..163 uncovered mentor model behaviours > PROJ-BREAK-MENTOR-156 resource audit records only registered action and identifiers

  ```
  AssertionError: expected { …(7) } to deeply equal { …(2) }
  - Expected
  + Received
  {
  +   "actionType": "CREATE",
  +   "afterJson": {
  +     "accessNotes": null,
  +     "description": null,
  ```
