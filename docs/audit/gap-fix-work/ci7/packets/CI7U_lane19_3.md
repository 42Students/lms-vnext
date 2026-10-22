# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-superadmin-middle-drives-27.test.tsx (1 failing)
- SA-middle-drives-27 platform administrator drive route isolation > authorized zero-row drive list renders truthful empty state with same-college loader

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ SuperAdminDriveDirectoryFilters src/components/placements/super-admin-drive-directory-filters.tsx:16:15
  14| export function SuperAdminDriveDirectoryFilters({q:initialQ,status:ini…
  15|  pageSize:initialSize}:{q:string;status:DriveStatusFilter;pageSize:num…
  16|  const router=useRouter();
  |               ^
  17|  const [q,setQ]=useState(initialQ);
  ```

## tests/unit/chat7-round2-mentor-03.test.ts (1 failing)
- chat-7 mentor overview evidence > MEN-projects-meetings-24 team card with explainer and count

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'See who is assigned, what role they p…'
  - Expected
  + Received
  - See who is assigned, what role they play
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat9-phase2-college-shortlist-recovery.test.ts (1 failing)
- College Admin shortlist page recovery > recovers a stale bookmark only after an authorized scoped read

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/chat9-phase2-college-shortlist-recovery.test.ts:18:19
  16|     const scopedRead=src.indexOf("getCollegeApplicationPipeline(contex…
  17|     const recovery=src.indexOf("if (query.page > data.totalPages) redi…
  18|     expect(guard).toBeGreaterThan(0);
  |                   ^
  19|     expect(scopedRead).toBeGreaterThan(guard);
  20|     expect(recovery).toBeGreaterThan(scopedRead);
  ```

## tests/unit/college-people-gap-closure.test.ts (2 failing)
- College People legacy audited page contracts > COL-people-20 Super Admin permission guards COLLEGE_ADMIN grant and revoke before writes

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'The College Admin role can only be as…'
  - Expected
  + Received
  - The College Admin role can only be assigned or removed by a Super Admin.
  + "use client";
  +
  + import {
  +   useRef,
  ```
- College People legacy audited page contracts > COL-people-21 shows persisted mentor workload risk and an Unassigned filter

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'fromMentorId='
  - Expected
  + Received
  - fromMentorId=
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
