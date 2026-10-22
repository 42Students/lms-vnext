# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-activity-owner-28.test.ts (1 failing)
- HR-ACTIVITY-OWNER-28 scope checks before activity and college chooser > projects only owned employer/college publication events, never private hiring activity

  ```
  TypeError: (intermediate value)(intermediate value)(intermediate value) is not iterable
  ❯ Module.listRecruiterJobActivity src/modules/placements/hr-job-activity-service.ts:29:16
  27|   inArray(activityEvents.eventType,[...hrActivityEventFilter(query.kin…
  28|  );
  29|  const [count]=ids.length?await getDb().select({total:sql<number>`coun…
  |                ^
  30|   .from(activityEvents).where(where):[{total:0}];
  31|  const effectivePage=clampHrActivityPage(query.page,Number(count?.tota…
  ```

## tests/unit/HR-BREAK-chat15-round-api-73.test.ts (2 failing)
- HR-ROUND-API-73: recruiter round command HTTP boundaries > stale version and used-round conflict return 409 without false success redirect

  ```
  AssertionError: expected { Object (error, message) } to match object { error: 'STALE_OR_USED_ROUND' }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  -   "error": "STALE_OR_USED_ROUND",
  +   "error": "PLACEMENT_ROUND_STALE",
  }
  ```
- HR-ROUND-API-73: recruiter round command HTTP boundaries > a foreign or deleted round maps to non-enumerating 404

  ```
  Error: [vitest] No "hrRoundEditorUnavailableMessage" export is defined on the "@/modules/placements/hr-round-editor-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/placements/hr-round-editor-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/HR-BREAK-chat19-drive-list-page.test.ts (2 failing)
- HR-BREAK-chat19-drive-list: selected college may never widen account data > multiple grants never auto-select the first college and query cross-college results

  ```
  AssertionError: expected '  Drives Select a college workspace t…' to contain 'Choose an authorized college'
  Expected: "Choose an authorized college"
  Received: "  Drives Select a college workspace to view its hiring drives.    "
  ```
- HR-BREAK-chat19-drive-list: selected college may never widen account data > zero grants offers placement-cell recovery, not platform-wide recruiter inventory

  ```
  AssertionError: expected '  Drives Select a college workspace t…' to contain 'No active college access'
  Expected: "No active college access"
  Received: "  Drives Select a college workspace to view its hiring drives.  Drive access is not switched on Your placement-cell relationship must be active and have Drives permission before any hiring drives are visible. Contact the placement cell to request access. "
  ```

## tests/unit/HR-BREAK-session-layout-01.test.ts (2 failing)
- HR-BREAK-session-layout-01: recruiter route entry under role and session changes > renders exactly the authorized child for a live recruiter

  ```
  AssertionError: expected { …(10) } to be { …(10) } // Object.is equality
  - Expected
  + Received
  + <React.Fragment>
  +   <a
  +     className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[max(1rem,env(safe-area-inset-top))] focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[var(--lms-control-radius)] focus:border focus:border-primary focus:bg-surface focus:px-4 focus:text-sm focu
  +     href="#hr-page-content"
  +   >
  ```
- HR-BREAK-session-layout-01: recruiter route entry under role and session changes > empty current grant list is allowed to render a no-access recovery page, not implicit access

  ```
  AssertionError: expected { …(10) } to be { …(10) } // Object.is equality
  - Expected
  + Received
  + <React.Fragment>
  +   <a
  +     className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[max(1rem,env(safe-area-inset-top))] focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[var(--lms-control-radius)] focus:border focus:border-primary focus:bg-surface focus:px-4 focus:text-sm focu
  +     href="#hr-page-content"
  +   >
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-evidence-pages.test.tsx (1 failing)
- Mentor evidence view privacy and empty-state boundaries > PROJ-BREAK-MENTOR-271 task feedback empty state does not fabricate a discussion thread

  ```
  AssertionError: expected '<div class="min-w-0 max-w-full space-…' to contain 'Back to authorized task Board'
  Expected: "Back to authorized task Board"
  Received: "<div class="min-w-0 max-w-full space-y-4 md:space-y-6"><header><h1>Recorded task review feedback</h1><p>Iteration review</p></header><section role="status"><h2>No recorded reviewer feedback</h2><p>No persisted submission-version feedback exists for this authorized task. Missing messages a
  ```

## tests/unit/PROJ-BREAK-chat14-sprint-task-routes.test.ts (1 failing)
- Sprint and task mutating routes under Mentor account > PROJ-BREAK-MENTOR-344 malformed Sprint/task editor JSON cannot invoke a write

  ```
  AssertionError: expected 400 to be 403 // Object.is equality
  - Expected
  + Received
  - 403
  + 400
  ```
