# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-college-placements-round2-verified.test.ts (1 failing)
- College placement verified operational parity > COL-placements-11 retention report and college student placement lookup are accessible

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain '.limit(200)'
  - Expected
  + Received
  - .limit(200)
  + import "server-only";
  + import {and,count,desc,eq,inArray,lt,notExists,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,placementApplications,placementApplicationScreenings,
  ```

## tests/unit/chat7-superadmin-course-tenant-bulk.test.ts (1 failing)
- SA-academics-people-52/53 GR-COURSES-TENANT-01 safe scoped Super Admin visibility and progress > the initial lesson-content query filters both college-owned departments and periods to acting scope before counting matches

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'lessons.length>500'
  - Expected
  + Received
  - lessons.length>500
  + import "server-only";
  + import {and,eq,inArray,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
