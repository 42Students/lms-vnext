# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat14-mentor-page-filter-privacy.test.tsx (1 failing)
- PROJ-BREAK-MENTOR-192..194 server-rendered project filters and disabled headings > PROJ-BREAK-MENTOR-194 disabled headings never display stale project names or statuses

  ```
  TypeError: Cannot read properties of undefined (reading 'releaseStatus')
  ❯ Module.MentorProjectTimelinePage src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx:34:29
  32|     await getCurrentRequestContext(),parsed.data,
  33|   );
  34|   const filtered=data.query.releaseStatus!=="ALL"||data.query.sprintSt…
  |                             ^
  35|   return <div className="min-w-0 max-w-full space-y-4">
  36|     <PageHeader title="Release & Sprint timeline"
  ```

## tests/unit/UX-courses-external-links-01.test.ts (1 failing)
- UX-courses-external-links-01 safe learner and offering external content > learner-youtube-player opens external media in the same tab and never grants opener access

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useEffec…' to match /href=\{(?:item\.)?externalUrl\}/
  - Expected:
  /href=\{(?:item\.)?externalUrl\}/
  + Received:
  "\"use client\";
  import {
  useEffect,
  useRef,
  ```

## tests/unit/chat11-super-admin-student-progress-revocation.test.ts (1 failing)
- SA-tenants-modules-COURSE-STUDENTS-10 private learner names survive revocation > reconstructs persisted Super Admin system role and locks active college after slow roster queries

  ```
  AssertionError: expected -1 to be greater than 10437
  ❯ tests/unit/chat11-super-admin-student-progress-revocation.test.ts:21:20
  19|   expect(sqlRead).toBeGreaterThan(-1);
  20|   expect(checked).toBeGreaterThan(sqlRead);
  21|   expect(response).toBeGreaterThan(checked);
  |                    ^
  22|   expect(source).toContain("if(!college||college.status!==\"ACTIVE\")"…
  23|   expect(source).toContain('if(!isSuperAdmin(live))throw new Authoriza…
  ```

## tests/unit/chat13-super-admin-placements-command-matrix.test.ts (1 failing)
- Super Admin Placements destructive command and concurrency matrix > SA-PUBLISHED-DRIVE-EDIT-02 rejects forged requests, duplicate locations, negative openings and inverted CTC

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain 'job.status!=="PUBLISHED"'
  - Expected
  + Received
  - job.status!=="PUBLISHED"
  + import "server-only";
  + import {and,count,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementApplications,placementJobs,placementJobRoleOptions,placementSeasons,placementCompanyRelationships} from "@/db/schema";
  ```
