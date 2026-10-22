# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-interview-slots-03.test.ts (2 failing)
- HR-SLOT-SERVICE-03 recruiter slot authorization and stale-window writes > HR-SLOT-STATE-03 offers only a future proposed own slot, with one TPO alert

  ```
  AssertionError: promise rejected "TypeError: Cannot read properties of unde…" instead of resolving
  ❯ tests/unit/HR-BREAK-chat15-interview-slots-03.test.ts:113:77
  111|  });
  112|  it("HR-SLOT-STATE-03 offers only a future proposed own slot, with one…
  113|   await expect(writeHrInterviewSlot(context as never,jobId,action("OFF…
  |                                                                             ^
  114|    .resolves.toEqual({id:slotId,status:"OFFERED"});
  115|   expect(mocks.update).toHaveBeenCalledTimes(1);
  ```
- HR-SLOT-SERVICE-03 recruiter slot authorization and stale-window writes > HR-SLOT-READ-01 exposes read-only slot metadata without granting foreign actor mutation

  ```
  AssertionError: promise rejected "TypeError: tx.select(...).from(...).inner…" instead of resolving
  ❯ tests/unit/HR-BREAK-chat15-interview-slots-03.test.ts:148:61
  146|    mode:"VIRTUAL",panelLabel:null,meetingLocation:null};
  147|   mocks.rows=[[job],[view]];
  148|   await expect(listHrInterviewSlots(context as never,jobId)).resolves.…
  |                                                             ^
  149|    status:"READY",items:[{id:slotId,isOwn:true,canEdit:true}],
  150|   });
  ```

## tests/unit/HR-BREAK-chat19-active-bell.test.tsx (2 failing)
- HR-BREAK-ACTIVE-BELL-34: visible recruiter bell does not auto-ack or leak stale notices > clears stale private notices on loss of access or late reordered refresh

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'setState(null);setError("Couldn\'t re…'
  - Expected
  + Received
  - setState(null);setError("Couldn't refresh your notifications")
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- HR-BREAK-ACTIVE-BELL-34: visible recruiter bell does not auto-ack or leak stale notices > provides 44px trigger and focusable hidden-scrollbar content affordance

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="dialog" aria-modal="false"'
  - Expected
  + Received
  - role="dialog" aria-modal="false"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/HR-BREAK-chat19-profile-page.test.ts (6 failing)
- HR-BREAK-chat19-profile-page: active recruiter reads and session denial > denies an expired session before profile/college access reads

  ```
  AssertionError: expected [Function] to throw error including 'REDIRECT' but got 'Cannot destructure property \'searchP…'
  Expected: "REDIRECT"
  Received: "Cannot destructure property 'searchParams' of 'undefined' as it is undefined."
  ```
- HR-BREAK-chat19-profile-page: active recruiter reads and session denial > denies a removed recruiter independently of college membership

  ```
  AssertionError: expected [Function] to throw error including 'REDIRECT' but got 'Cannot destructure property \'searchP…'
  Expected: "REDIRECT"
  Received: "Cannot destructure property 'searchParams' of 'undefined' as it is undefined."
  ```
- HR-BREAK-chat19-profile-page: active recruiter reads and session denial > HR-BREAK-PROFILE-IDENTITY-10 rejects mismatched recruiter identity before profile and grant reads

  ```
  AssertionError: expected [Function] to throw error including 'REDIRECT' but got 'Cannot destructure property \'searchP…'
  Expected: "REDIRECT"
  Received: "Cannot destructure property 'searchParams' of 'undefined' as it is undefined."
  ```
- HR-BREAK-chat19-profile-page: active recruiter reads and session denial > shows only the authenticated recruiter's own email and employer from service projections

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.HrProfilePage src/app/(authenticated)/hr/profile/page.tsx:17:47
  15| import { getRecruiterSelfGrantOverview } from "@/modules/placements/re…
  16|
  17| export default async function HrProfilePage({ searchParams }: {
  |                                               ^
  18|   searchParams?: Promise<{ collegeId?: string | string[] }>;
  19| }) {
  ```
- HR-BREAK-chat19-profile-page: active recruiter reads and session denial > requires service projection to succeed and never silently reuses a stale profile cache

  ```
  AssertionError: expected [Function] to throw error including 'profile unavailable' but got 'Cannot destructure property \'searchP…'
  Expected: "profile unavailable"
  Received: "Cannot destructure property 'searchParams' of 'undefined' as it is undefined."
  ```
- HR-BREAK-PROFILE-SCOPE-44 private profile state isolation > the server does not expose the previous actor's profile on a newly authorized actor

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.HrProfilePage src/app/(authenticated)/hr/profile/page.tsx:17:47
  15| import { getRecruiterSelfGrantOverview } from "@/modules/placements/re…
  16|
  17| export default async function HrProfilePage({ searchParams }: {
  |                                               ^
  18|   searchParams?: Promise<{ collegeId?: string | string[] }>;
  19| }) {
  ```

## tests/unit/PROJ-BREAK-SA-35-legacy-project-redirect.test.ts (2 failing)
- PROJ-BREAK-SA-35 legacy Super Admin project redirect hardening > invalid UUID routes go to not-found, without querying the project

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <ErrorState
  +   action={
  +     <ForwardRef(LinkComponent)
  ```
- PROJ-BREAK-SA-35 legacy Super Admin project redirect hardening > redirects only a selected-college authorized UUID to its canonical summary

  ```
  AssertionError: expected [Function] to throw error including 'NEXT_REDIRECT' but got 'Cannot read properties of undefined (…'
  Expected: "NEXT_REDIRECT"
  Received: "Cannot read properties of undefined (reading 'from')"
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-reports-page.test.tsx (3 failing)
- PROJ-BREAK-MENTOR-64..69 rendered report page boundary and failure states > PROJ-BREAK-MENTOR-64 duplicated same-value search parameters are not silently collapsed

  ```
  AssertionError: expected '<section role="alert" class="space-y-…' to contain 'Invalid Mentor report filters'
  Expected: "Invalid Mentor report filters"
  Received: "<section role="alert" class="space-y-3"><header><h1>Assigned project reports</h1><p>Invalid mentor report filters</p></header><a href="/mentor/reports">Clear filters</a></section>"
  ```
- PROJ-BREAK-MENTOR-64..69 rendered report page boundary and failure states > PROJ-BREAK-MENTOR-65 invalid enum, forged status and excessive page reject before service

  ```
  AssertionError: expected '<section role="alert" class="space-y-…' to contain 'Invalid Mentor report filters'
  Expected: "Invalid Mentor report filters"
  Received: "<section role="alert" class="space-y-3"><header><h1>Assigned project reports</h1><p>Invalid mentor report filters</p></header><a href="/mentor/reports">Clear filters</a></section>"
  ```
- PROJ-BREAK-MENTOR-64..69 rendered report page boundary and failure states > PROJ-BREAK-MENTOR-66 empty authorized report never invents success or learner outcome data

  ```
  AssertionError: expected '<div class="min-w-0 max-w-full space-…' to contain 'Assigned Project reports'
  Expected: "Assigned Project reports"
  Received: "<div class="min-w-0 max-w-full space-y-4 md:space-y-6"><header><h1>Assigned project reports</h1><p>Persisted project states and actionable attention across your current assigned workspaces.</p><a href="/mentor/projects">Projects list</a></header><section data-slot="filter-bar" data-open="
  ```

## tests/unit/PROJ-BREAK-chat6-backlog-readiness-cross-scope.test.ts (1 failing)
- IIT Dharwad Projects breaker: backlog, readiness and tenant boundaries > PROJ-BREAK-readiness-12 forbids global or cross-college readiness history leaks

  ```
  AssertionError: expected 'export async function listCollegeActi…' to contain 'ne(projectInstances.status,"ARCHIVED")'
  - Expected
  + Received
  - ne(projectInstances.status,"ARCHIVED")
  + export async function listCollegeActiveReadinessOverrides(context: RequestContext, collegeId: string) {
  +   const requestedCollegeId=z.string().uuid().parse(collegeId);
  +   if(getProjectAdminCollegeId(context)!==requestedCollegeId)
  +     throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  ```
