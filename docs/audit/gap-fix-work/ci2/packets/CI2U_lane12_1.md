# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-drive-new-page-79.test.tsx (6 failing)
- HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey > rejects duplicate college IDs and conflicting edit/fix links

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <DriveSourceUnavailable />
  ```
- HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey > rejects other-college direct URL before searching request history

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <DriveSourceUnavailable />
  ```
- HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey > no grants renders an access-recovery state without draft persistence

  ```
  AssertionError: expected [ 'Request a drive', …(2) ] to include 'No active college access'
  ❯ tests/unit/HR-BREAK-chat15-drive-new-page-79.test.tsx:75:28
  73|   m.ctx.mockResolvedValue({...actor,recruiter:{...actor.recruiter!,gra…
  74|   const rendered=await view();
  75|   expect(titles(rendered)).toContain("No active college access");
  |                            ^
  76|   expect(m.requests).not.toHaveBeenCalled();
  77|   expect(m.branches).not.toHaveBeenCalled();
  ```
- HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey > multi-college employer must pick college before any request or branch lookup

  ```
  AssertionError: expected [ undefined, undefined, …(2) ] to include '/hr/drives/new?collegeId=11111111-111…'
  ❯ tests/unit/HR-BREAK-chat15-drive-new-page-79.test.tsx:86:17
  84|   const rendered=await view();
  85|   const links=elements(rendered).map(el=>(el.props as {href?:string}).…
  86|   expect(links).toContain("/hr/drives/new?collegeId="+own);
  |                 ^
  87|   expect(links).toContain("/hr/drives/new?collegeId="+other);
  88|   expect(m.requests).not.toHaveBeenCalled();
  ```
- HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey > revoked or wrong-status request cannot be edited from a stale URL

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <DriveSourceUnavailable
  +   collegeId="11111111-1111-4111-8111-111111111111"
  ```
- HR-DRIVE-PAGE-79: actual recruiter request drive page role and stale-link journey > authorized single-college request presents real editor input and preserved branch choices

  ```
  ZodError: [
  {
  "origin": "string",
  "code": "invalid_format",
  "format": "uuid",
  "pattern": "/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/",
  "path": [],
  "message": "Invalid UUID"
  ```

## tests/unit/HR-BREAK-chat15-tracker-mine-page-98.test.tsx (2 failing)
- HR-TRACKER-PAGE-98 recruiter-owned bug reports survive transient failures > database timeout renders a recoverable inline error, not an invented empty list

  ```
  AssertionError: expected [] to include '/tracker/mine'
  ❯ tests/unit/HR-BREAK-chat15-tracker-mine-page-98.test.tsx:45:23
  43|   expect(text(node)).toContain("We could not load your reports.");
  44|   expect(text(node)).not.toContain("internal.private");
  45|   expect(links(node)).toContain("/tracker/mine");
  |                       ^
  46|  });
  47|  it("empty own-reports list invites the user to report an issue",async…
  ```
- HR-TRACKER-PAGE-98 recruiter-owned bug reports survive transient failures > empty own-reports list invites the user to report an issue

  ```
  AssertionError: expected [] to include '/tracker'
  ❯ tests/unit/HR-BREAK-chat15-tracker-mine-page-98.test.tsx:50:23
  48|   const node=await MyTrackerReportsPage();
  49|   expect(text(node)).toContain("You have not reported any issues yet."…
  50|   expect(links(node)).toContain("/tracker");
  |                       ^
  51|  });
  52|  it("private report list links only data returned by the scoped report…
  ```

## tests/unit/HR-BREAK-chat19-messaging-receipt-history-service.test.ts (1 failing)
- HR-BREAK-MESSAGING-HISTORY-01: persisted TPO/HR boundary and immutable receipt export > rejects invalid history filters before touching the database

  ```
  AssertionError: promise resolved "[ { …(12) } ]" instead of rejecting
  - Expected:
  Error {
  "message": "rejected promise",
  }
  + Received:
  [
  {
  ```

## tests/unit/PROJ-BREAK-LEARNER-RELEASE-01.test.ts (1 failing)
- PROJ-BREAK-LEARNER-RELEASE-01 task deletion across lifecycle and authorization > deletes only own unreviewed TODO task on an ACTIVE release with an activity and mentor notification

  ```
  AssertionError: promise rejected "TypeError: Cannot read properties of unde…" instead of resolving
  ❯ tests/unit/PROJ-BREAK-LEARNER-RELEASE-01.test.ts:97:63
  95|  it("deletes only own unreviewed TODO task on an ACTIVE release with a…
  96|   state.releaseStatus="IN_PROGRESS";
  97|   await expect(deleteLearnerOwnTask(actor,{projectId},taskId)).resolve…
  |                                                               ^
  98|   expect(state.guard).toHaveBeenCalledOnce();
  99|   expect(state.deleted).toHaveBeenCalledOnce();
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-read-service-gates.test.ts (1 failing)
- PROJ-BREAK-MENTOR-178..184 read-service access and disabled modules > PROJ-BREAK-MENTOR-183 valid same-tenant authorized reads reach real data dependencies

  ```
  AssertionError: promise resolved "{ enabled: true, query: { …(6) }, …(6) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "enabled": true,
  +   "items": [],
  ```

## tests/unit/PROJ-BREAK-chat4-college-summary.test.ts (1 failing)
- College Admin Projects summary break-it journeys > PROJ-BREAK-COL-TENANT-01 summary write keeps project and section inside persisted college

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'requireProjectManageAccess(context,pr…'
  - Expected
  + Received
  - requireProjectManageAccess(context,projectId)
  + import "server-only";
  + import {and,eq,isNotNull,isNull,ne,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
  ```
