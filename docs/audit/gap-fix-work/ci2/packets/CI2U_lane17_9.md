# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-placements-core-state-machines.test.ts (1 failing)
- chat-5 core placement drive transition invariants > PLACEMENTS-LIFECYCLE-03 prevents reopen after results and accepted offers

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat6-auth-device-routes.test.ts (2 failing)
- device-session HTTP ownership and CSRF matrix > AUTH-DEVICE-ROUTE-03 signs out other devices while preserving the current session ID

  ```
  AssertionError: expected { ok: true, revoked: 1, …(5) } to deeply equal { ok: true, revoked: 1 }
  - Expected
  + Received
  {
  +   "currentExcluded": true,
  +   "currentSessionRevoked": false,
  +   "message": "Other sessions revoked",
  "ok": true,
  ```
- device-session HTTP ownership and CSRF matrix > AUTH-DEVICE-ROUTE-05 returns 404 when the requested device belongs to someone else

  ```
  AssertionError: expected { error: 'SESSION_NOT_FOUND', …(1) } to deeply equal { error: 'SESSION_NOT_FOUND' }
  - Expected
  + Received
  {
  "error": "SESSION_NOT_FOUND",
  +   "message": "Session not found",
  }
  ```

## tests/unit/chat6-faculty-dirty-drawers-r03.test.ts (1 failing)
- Faculty assessment draft close safety > FAC-assessments-R03 protects edited create and edit drawers, reset after save and beforeunload

  ```
  AssertionError: expected '"use client";\n\nimport {useId,useMem…' to contain 'onSaved={()=>setDraftDirty(false)}'
  - Expected
  + Received
  - onSaved={()=>setDraftDirty(false)}
  + "use client";
  +
  + import {useId,useMemo,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```

## tests/unit/chat6-recruiter-lifecycle-round3.test.ts (1 failing)
- Super Admin recruiter legacy lifecycle > SA-academics-people-114 restores recruiter accounts page search and college access copy

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'eyebrow="Industry access"'
  - Expected
  + Received
  - eyebrow="Industry access"
  + "use client";
  +
  + import {
  +   useRef,
  ```

## tests/unit/chat6-superadmin-new-drive-auth.test.tsx (1 failing)
- Super Admin create-drive authorization before data lookup > SA-admin-middle-new-drive-auth-03 passes only selected college to the authorized write workspace

  ```
  TypeError: PlacementJobCreateWorkspace(...).then is not a function
  ❯ Module.AdminNewPlacementPage src/app/(authenticated)/admin/placements/new/page.tsx:27:6
  25|   const loaded=await PlacementJobCreateWorkspace({
  26|     context,collegeId,basePath:"/admin/placements",
  27|   }).then(view=>({ok:true as const,view}))
  |      ^
  28|     .catch(error=>{
  29|       if (error instanceof AuthorizationError) throw error;
  ```

## tests/unit/chat7-course-delivery-roster-weak.test.ts (1 failing)
- COURSES-WEAK-DELIVERY-ROSTER-01 exact College, Section and Elective enrolment gates > returns only authorized Section learners when no active elective offering backs delivery

  ```
  AssertionError: expected "vi.fn()" to be called 2 times, but got 3 times
  ❯ tests/unit/chat7-course-delivery-roster-weak.test.ts:31:24
  29|   const rows=await listActiveDeliveryLearners(scope);
  30|   expect(rows).toEqual([result]);
  31|   expect(state.select).toHaveBeenCalledTimes(2);
  |                        ^
  32|  });
  33|  it("uses elective group learners instead of leaking the normal Sectio…
  ```
