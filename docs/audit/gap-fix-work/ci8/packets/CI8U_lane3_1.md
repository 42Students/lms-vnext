# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat14-mentor-page-filter-privacy.test.tsx (1 failing)
- PROJ-BREAK-MENTOR-192..194 server-rendered project filters and disabled headings > PROJ-BREAK-MENTOR-194 disabled headings never display stale project names or statuses

  ```
  TypeError: Cannot read properties of undefined (reading 'view')
  ❯ Module.MentorTeamHistoryPage src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx:46:29
  44|   const data = await getMentorTeamHistory(context, parsed.data);
  45|   const back = "/mentor/projects/" + encodeURIComponent(projectId) + "…
  46|   const filtered=data.query.view!=="ALL"||data.query.role!=="ALL"||dat…
  |                             ^
  47|   return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  48|     <PageHeader title="Team membership history"
  ```

## tests/unit/UX-recruiter-drives-jobId-change-requests-01.test.ts (1 failing)
- UX-recruiter-drives-jobId-change-requests-01 > preserves role-safe navigation, exact route copy and accessible shared surface

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import Link from "next/link";
  + import { cx } from "@/lib/class-names";
  + import { isSafeInternalHref } from "@/lib/safe-internal-href";
  +
  ```
