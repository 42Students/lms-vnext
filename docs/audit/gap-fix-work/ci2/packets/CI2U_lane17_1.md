# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-messaging-page-83.test.tsx (4 failing)
- HR-MESSAGING-83: general preview failure is recoverable without double-open > secondary general directory timeout preserves the authorized main message page

  ```
  AssertionError: expected '     Messages 0 conversations · undef…' to contain 'General conversation preview is tempo…'
  Expected: "General conversation preview is temporarily unavailable."
  Received: "     Messages 0 conversations · undefined unread messages             Search and sort conversations              Order     Most recently updated   Oldest updated first   Search by drive or message      Search         0  unread placement cell messages in these conversations    Showing  0 –
  ```
- HR-MESSAGING-83: general preview failure is recoverable without double-open > genuine empty general directory offers the single-flight general conversation opener

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- HR-MESSAGING-83: general preview failure is recoverable without double-open > malformed duplicate college filters never read private messages

  ```
  AssertionError: expected '  Messages   Invalid conversation fil…' to contain 'Invalid conversation filters.'
  Expected: "Invalid conversation filters."
  Received: "  Messages   Invalid conversation filters Review the college and conversation filters. "
  ```
- HR-MESSAGING-83: general preview failure is recoverable without double-open > primary inbox outage remains a real page failure and does not invent empty status

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  - }
  + <div
  +   className="min-w-0 space-y-3"
  ```

## tests/unit/HR-BREAK-chat19-calendar-company-pages.test.ts (5 failing)
- HR-BREAK-chat19-calendar-company: account-deny and stable navigation > malformed calendar day, view and category use bounded fallback rather than DB exceptions

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ { user: { …(4) }, …(2) }, …(1) ]
  Received:
  1st vi.fn() call:
  @@ -22,10 +22,11 @@
  "identityUid": "identity",
  "platformStatus": "ACTIVE",
  "systemRoles": [],
  },
  ```
- HR-BREAK-chat19-calendar-company: account-deny and stable navigation > refuses repeated calendar filters {"date":["2026-10-18","2026-10-19"]} without reading authorized events

  ```
  
  ```
- HR-BREAK-chat19-calendar-company: account-deny and stable navigation > refuses repeated calendar filters {"view":["week","month"]} without reading authorized events

  ```
  
  ```
- HR-BREAK-chat19-calendar-company: account-deny and stable navigation > refuses repeated calendar filters {"category":["ALL","PRIVATE"]} without reading authorized events

  ```
  AssertionError: expected '  Calendar   Invalid calendar filters…' to contain 'Invalid calendar filters.'
  Expected: "Invalid calendar filters."
  Received: "  Calendar   Invalid calendar filters Review the selected date, view and event filters. "
  ```
- HR-BREAK-chat19-calendar-company: account-deny and stable navigation > no grants provides clear company access recovery without roster/drive reads

  ```
  AssertionError: expected '  Company & Team Choose the college w…' to contain 'No active college access'
  Expected: "No active college access"
  Received: "  Company & Team Choose the college whose recruiter relationship you want to view. We never guess a college when more than one access grant is active.  Open this on your college's placement address Your recruiter account has no active college session. Contact the placement cell that invit
  ```

## tests/unit/HR-BREAK-chat19-scope-pages.test.ts (1 failing)
- HR-BREAK-chat19-report-external-pages: college choice, forgery, no-access > confirmed saved record does not claim a student-visible job was published

  ```
  AssertionError: expected '  Record an outside-platform drive Hi…' to contain 'External drive record saved.'
  Expected: "External drive record saved."
  Received: "  Record an outside-platform drive Historical employer-college record only. This cannot publish a student-visible job.         "
  ```

## tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts (1 failing)
- Super Admin Projects and Placements page routes — independent security and UX audit > PROJ-BREAK-SA-15 audits every live /admin placement/project page for auth or scope-enforcing delegate

  ```
  AssertionError: expected [ …(57) ] to have a length of 48 but got 57
  - Expected
  + Received
  - 48
  + 57
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-root-workspace-pages.test.tsx (4 failing)
- Mentor landing, project directory/workspace and calendar role journeys > PROJ-BREAK-MENTOR-292 disabled project landing preserves notifications as recovery

  ```
  AssertionError: expected '<section role="status" aria-live="pol…' to contain 'college administrator'
  Expected: "college administrator"
  Received: "<section role="status" aria-live="polite" class="mx-auto flex min-h-[320px] w-full max-w-[700px] flex-col items-center justify-center px-4 py-12 text-center md:py-16"><span aria-hidden="true" class="mb-5 flex size-16 items-center justify-center rounded-full border text-[32px] border-[var(
  ```
- Mentor landing, project directory/workspace and calendar role journeys > PROJ-BREAK-MENTOR-293 policy outage shows retry rather than pretending feature disabled

  ```
  AssertionError: expected '<section role="alert" aria-live="poli…' to contain 'Projects could not be loaded'
  Expected: "Projects could not be loaded"
  Received: "<section role="alert" aria-live="polite" class="mx-auto flex min-h-[320px] w-full max-w-[700px] flex-col items-center justify-center px-4 py-12 text-center md:py-16"><span aria-hidden="true" class="mb-5 flex size-16 items-center justify-center rounded-full border text-[32px] border-[var(-
  ```
- Mentor landing, project directory/workspace and calendar role journeys > PROJ-BREAK-MENTOR-294 wrong role cannot call project directory service

  ```
  AssertionError: promise resolved "'<div class="min-w-0 space-y-4" aria-b…'" instead of rejecting
  - Expected:
  Error {
  "message": "rejected promise",
  }
  + Received:
  "<div class=\"min-w-0 space-y-4\" aria-busy=\"true\" aria-label=\"Checking Projects access\"><header><h1>Projects</h1><p>Checking Projects access…</p></header><section data-slot=\"loading-state\" class=\"min-w-0 bg-transparent py-[var(--lms-space-2)]\"><div role=\"status\" aria-live=\"polite\" data-
  ```
- Mentor landing, project directory/workspace and calendar role journeys > PROJ-BREAK-MENTOR-295 disabled project directory never queries project roster

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4" aria-b…' to contain 'Projects are disabled'
  Expected: "Projects are disabled"
  Received: "<div class="min-w-0 space-y-4" aria-busy="true" aria-label="Checking Projects access"><header><h1>Projects</h1><p>Checking Projects access…</p></header><section data-slot="loading-state" class="min-w-0 bg-transparent py-[var(--lms-space-2)]"><div role="status" aria-live="polite" data-slot
  ```

## tests/unit/PROJ-BREAK-chat7-learner-board-filters-and-scroll.test.ts (2 failing)
- PROJ-BREAK-LEARNER-96/97 board filter and mobile navigation resilience > validates hostile query filters only after scoped project read, then renders actionable recovery

  ```
  AssertionError: expected 'import { getProjectActivityPage } fro…' to contain '!learnerBoardStatusSchema.safeParse(t…'
  - Expected
  + Received
  - !learnerBoardStatusSchema.safeParse(taskStatusInput).success
  + import { getProjectActivityPage } from "@/modules/projects/activity-service";
  + import { parseLearnerProjectActivityFilters } from "@/modules/projects/learner-project-activity-filter-model";
  + import { LearnerProjectActivity } from "@/components/projects/learner-project-activity";
  + import { notFound, redirect } from "next/navigation";
  ```
- PROJ-BREAK-LEARNER-96/97 board filter and mobile navigation resilience > preserves keyboard and touch access when Board lanes overflow a 320px device

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'overscroll-x-contain'
  - Expected
  + Received
  - overscroll-x-contain
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
